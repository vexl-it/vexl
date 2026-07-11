import {constantTimeEqualStrings} from '@vexl-next/cryptography/src/operations/deviceMigration/constantTimeEqual'
import {
  generateRandomBase64Url,
  generateRandomBytes,
} from '@vexl-next/cryptography/src/operations/deviceMigration/randomBytes'
import {
  createDecryptStream,
  createEncryptStream,
  SECRETSTREAM_FRAME_OVERHEAD_BYTES,
  SECRETSTREAM_HEADER_BYTES,
  type EncryptStream,
} from '@vexl-next/cryptography/src/operations/deviceMigration/secretstream'
import {
  createSha256,
  sha256Bytes,
  type Sha256Stream,
} from '@vexl-next/cryptography/src/operations/deviceMigration/sha256'
import {Sha256Hex} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {
  computeLeafDigest,
  computeManifestDigest,
  computeSnapshotContentRoot,
  encodeFileLeaf,
  encodeMmkvLeaf,
  encodeSessionLeaf,
  mmkvEntryValueBytes,
  type FileSnapshotLeaf,
  type MmkvSnapshotLeaf,
  type SnapshotLeaf,
} from '@vexl-next/domain/src/general/deviceMigration/contentDigest'
import {
  bytesToHex,
  u32be,
  utf8Encode,
} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {MAX_DATA_CHUNK_PLAINTEXT_BYTES} from '@vexl-next/domain/src/general/deviceMigration/limits'
import {
  MmkvEntry,
  type NormalizedRelativeFilePath,
} from '@vexl-next/domain/src/general/deviceMigration/snapshotEntries'
import {
  SnapshotManifest,
  toCanonicalManifestForDigest,
  type FileDescriptor,
} from '@vexl-next/domain/src/general/deviceMigration/snapshotManifest'
import {
  CURRENT_MIGRATION_PROTOCOL_VERSION,
  CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
} from '@vexl-next/domain/src/general/deviceMigration/version'
import {Effect, Either, Option, Schema} from 'effect'
import {
  Directory,
  File,
  FileMode,
  Paths,
  type FileHandle,
} from 'expo-file-system'
import {Base64} from 'js-base64'
import {
  isSessionV2,
  sanityCheckSessionV2,
  Session,
} from '../../../brands/Session.brand'
import {resolveMmkvKeyPolicy} from '../../atomUtils/mmkvMigrationRegistry'
import {loadMigrationSecret, saveMigrationSecret} from '../controlStore/secrets'
import {EXPORTED_MIGRATION_POLICIES, STAGING_DIRECTORY_NAME} from './constants'
// Imported for its side effects: staging verification resolves every staged
// key through the migration registry, which must be completely populated
// regardless of which modules Metro's inline-requires evaluated so far.
import './ensurePersistenceModulesRegistered'
import {documentDirectory} from './snapshotFileSystem'

/**
 * Destination-side encrypted staging store (spec section "Encrypted
 * staging"). The received snapshot is persisted under
 * `Documents/device-migration-staging/` before it ever becomes live
 * application state:
 *
 * - every staged blob (manifest, MMKV entries, logical session, files) is a
 *   separate file with a RANDOM name revealing neither account identity nor
 *   original paths;
 * - blob contents are encrypted with a per-migration staging key (32 CSPRNG
 *   bytes held in migration-specific device-only SecureStore — see
 *   controlStore/secrets.ts) through a FRESH secretstream per blob, header
 *   prefixed, frames length-prefixed and limited to 64 KiB plaintext;
 * - per-file SHA-256 and byte length are verified while chunks arrive;
 * - `verifyStagingComplete` re-reads EVERYTHING from disk and independently
 *   recomputes the snapshot content digest — the required re-read before the
 *   erase-command QR may be created.
 *
 * PRIVACY: staged bytes, names, digests and counts are sensitive migration
 * data. Every failure surfaces as `DeviceMigrationError` with an enumerated
 * code only.
 */

export {STAGING_DIRECTORY_NAME}

const STAGING_INDEX_FILE_NAME = 'index'
const STAGING_KEY_BYTES = 32
const RANDOM_BLOB_NAME_BYTES = 16

const MIB = 1024 * 1024
/** Free-disk headroom required on top of 2× the snapshot size. */
export const REQUIRED_FREE_DISK_HEADROOM_BYTES = 100 * MIB

const StagingIndex = Schema.Struct({
  manifestBlob: Schema.optional(Schema.String),
  sessionBlob: Schema.optional(Schema.String),
  entryBlobs: Schema.Record({key: Schema.String, value: Schema.String}),
  fileBlobs: Schema.Record({key: Schema.String, value: Schema.String}),
})
type StagingIndex = typeof StagingIndex.Type

const decodeStagingIndex = Schema.decodeUnknownEither(
  Schema.parseJson(StagingIndex)
)
const encodeStagingIndex = Schema.encodeSync(Schema.parseJson(StagingIndex))
const decodeMmkvEntry = Schema.decodeUnknownEither(Schema.parseJson(MmkvEntry))
const encodeMmkvEntry = Schema.encodeSync(Schema.parseJson(MmkvEntry))
const decodeManifest = Schema.decodeUnknownEither(
  Schema.parseJson(SnapshotManifest)
)
const encodeManifest = Schema.encodeSync(Schema.parseJson(SnapshotManifest))
const decodeSession = Schema.decodeUnknownEither(Schema.parseJson(Session))

const err = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

function stagingDirectoryUri(): Effect.Effect<string, DeviceMigrationError> {
  return Effect.map(documentDirectory(), (documents) =>
    Paths.join(documents.uri, STAGING_DIRECTORY_NAME)
  )
}

// ---------------------------------------------------------------------------
// Staging key
// ---------------------------------------------------------------------------

function loadStagingKey(): Effect.Effect<Uint8Array, DeviceMigrationError> {
  return loadMigrationSecret('stagingKey').pipe(
    Effect.flatMap((stored) => {
      if (Option.isNone(stored)) return Effect.fail(err('stagingIncomplete'))
      return Effect.try({
        try: () => {
          const key = Base64.toUint8Array(stored.value)
          if (key.length !== STAGING_KEY_BYTES) throw new Error('bad key')
          return key
        },
        catch: () => err('stagingIncomplete'),
      })
    })
  )
}

// ---------------------------------------------------------------------------
// Encrypted blob primitives
// ---------------------------------------------------------------------------

function chunkPlaintext(bytes: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = []
  for (
    let offset = 0;
    offset < bytes.length;
    offset += MAX_DATA_CHUNK_PLAINTEXT_BYTES
  ) {
    chunks.push(bytes.slice(offset, offset + MAX_DATA_CHUNK_PLAINTEXT_BYTES))
  }
  return chunks
}

function writeFrame(handle: FileHandle, frame: Uint8Array): void {
  handle.writeBytes(u32be(frame.length))
  handle.writeBytes(frame)
}

/** Encrypts one complete plaintext into a fresh header-prefixed blob file. */
function writeEncryptedBlob(args: {
  readonly key: Uint8Array
  readonly fileUri: string
  readonly plaintext: Uint8Array
}): Effect.Effect<void, DeviceMigrationError> {
  return Effect.tryPromise({
    try: async () => {
      const stream = await createEncryptStream(args.key)
      const file = new File(args.fileUri)
      file.create({intermediates: true, overwrite: true})
      const handle = file.open(FileMode.Truncate)
      try {
        handle.writeBytes(stream.header)
        const chunks = chunkPlaintext(args.plaintext)
        if (chunks.length === 0) {
          writeFrame(handle, stream.push(new Uint8Array(0), true))
        } else {
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            if (chunk === undefined) throw new Error('unreachable')
            writeFrame(handle, stream.push(chunk, i === chunks.length - 1))
          }
        }
      } finally {
        handle.close()
      }
    },
    catch: () => err('transportFailed'),
  })
}

interface BlobReadState {
  readonly handle: FileHandle
  readonly fileSize: number
  bytesRead: number
}

function readExactly(
  state: BlobReadState,
  length: number
): Uint8Array | undefined {
  if (length === 0) return new Uint8Array(0)
  const bytes = state.handle.readBytes(length)
  state.bytesRead += bytes.length
  if (bytes.length !== length) return undefined
  return bytes
}

/**
 * Streams one encrypted blob from disk, decrypting and authenticating frame
 * by frame in bounded memory. Fails with `stagingIncomplete` on truncation,
 * corruption, trailing bytes or a missing final tag.
 */
function streamDecryptBlob(args: {
  readonly key: Uint8Array
  readonly fileUri: string
  readonly onChunk: (bytes: Uint8Array) => void
}): Effect.Effect<void, DeviceMigrationError> {
  return Effect.tryPromise({
    try: async () => {
      const file = new File(args.fileUri)
      if (!file.exists) throw new Error('missing blob')
      const state: BlobReadState = {
        handle: file.open(FileMode.ReadOnly),
        fileSize: file.size,
        bytesRead: 0,
      }
      try {
        const header = readExactly(state, SECRETSTREAM_HEADER_BYTES)
        if (header === undefined) throw new Error('truncated header')
        const stream = await createDecryptStream(args.key, header)

        for (;;) {
          if (stream.isFinished()) {
            // Trailing bytes after the final frame are a corruption signal.
            if (state.bytesRead !== state.fileSize)
              throw new Error('trailing bytes')
            return
          }
          const lengthPrefix = readExactly(state, 4)
          if (lengthPrefix === undefined) throw new Error('truncated stream')
          const frameLength = new DataView(
            lengthPrefix.buffer,
            lengthPrefix.byteOffset,
            4
          ).getUint32(0, false)
          if (
            frameLength < SECRETSTREAM_FRAME_OVERHEAD_BYTES ||
            frameLength >
              MAX_DATA_CHUNK_PLAINTEXT_BYTES + SECRETSTREAM_FRAME_OVERHEAD_BYTES
          )
            throw new Error('invalid frame length')
          const frame = readExactly(state, frameLength)
          if (frame === undefined) throw new Error('truncated frame')
          let plaintext: Uint8Array
          try {
            plaintext = stream.pull(frame).plaintext
          } catch {
            throw err('digestMismatch')
          }
          if (plaintext.length > 0) args.onChunk(plaintext)
        }
      } finally {
        state.handle.close()
      }
    },
    catch: (cause) =>
      cause instanceof DeviceMigrationError ? cause : err('stagingIncomplete'),
  })
}

/** Reads one complete (bounded-size) encrypted blob into memory. */
function readEncryptedBlob(args: {
  readonly key: Uint8Array
  readonly fileUri: string
}): Effect.Effect<Uint8Array, DeviceMigrationError> {
  return Effect.suspend(() => {
    const chunks: Uint8Array[] = []
    return streamDecryptBlob({
      key: args.key,
      fileUri: args.fileUri,
      onChunk: (bytes) => chunks.push(bytes),
    }).pipe(
      Effect.map(() => {
        let total = 0
        for (const chunk of chunks) total += chunk.length
        const result = new Uint8Array(total)
        let offset = 0
        for (const chunk of chunks) {
          result.set(chunk, offset)
          offset += chunk.length
        }
        return result
      })
    )
  })
}

function utf8Decode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('utf8')
}

function sha256HexOf(bytes: Uint8Array): string {
  return bytesToHex(sha256Bytes(bytes))
}

// ---------------------------------------------------------------------------
// Disk space
// ---------------------------------------------------------------------------

/**
 * Fails with `insufficientDiskSpace` unless the available disk space is at
 * least twice the declared uncompressed snapshot size plus 100 MiB (staging
 * plus an idempotent live install — spec section "Encrypted staging").
 */
export function freeDiskSpaceSufficient(
  manifest: SnapshotManifest
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.suspend(() => {
    let available: number
    try {
      available = Paths.availableDiskSpace
    } catch {
      return Effect.fail(err('insufficientDiskSpace'))
    }
    if (
      available <
      manifest.totalByteLength * 2 + REQUIRED_FREE_DISK_HEADROOM_BYTES
    )
      return Effect.fail(err('insufficientDiskSpace'))
    return Effect.void
  })
}

// ---------------------------------------------------------------------------
// Staging writer
// ---------------------------------------------------------------------------

interface InProgressStagedFile {
  readonly blobName: string
  readonly handle: FileHandle
  readonly encrypt: EncryptStream
  readonly hash: Sha256Stream
  written: number
  pendingChunk: Uint8Array | undefined
}

export interface DeviceMigrationStaging {
  /**
   * Validates and stages the snapshot manifest. Must be the first staged
   * record: recomputes the manifest digest, requires exact protocol/storage
   * version equality and sufficient free disk.
   */
  readonly stageManifest: (
    manifest: SnapshotManifest
  ) => Effect.Effect<void, DeviceMigrationError>
  /**
   * Validates one typed MMKV entry against its manifest descriptor (type,
   * canonical byte length, SHA-256) and stages it encrypted.
   */
  readonly stageMmkvEntry: (
    entry: MmkvEntry
  ) => Effect.Effect<void, DeviceMigrationError>
  /** Validates the canonical logical session bytes and stages them. */
  readonly stageSessionJson: (
    sessionJson: string
  ) => Effect.Effect<void, DeviceMigrationError>
  /**
   * Appends one ≤64 KiB chunk of a file record. The per-file SHA-256 and
   * byte length are verified as chunks arrive.
   */
  readonly appendFileChunk: (
    path: NormalizedRelativeFilePath,
    bytes: Uint8Array
  ) => Effect.Effect<void, DeviceMigrationError>
  /**
   * Closes one file record and verifies the received content matches the
   * manifest descriptor exactly (`digestMismatch` otherwise).
   */
  readonly finalizeFile: (
    path: NormalizedRelativeFilePath
  ) => Effect.Effect<void, DeviceMigrationError>
}

/**
 * Starts a FRESH staging session: deletes any previous staging directory,
 * generates a new random staging key, stores it read-back-verified in
 * migration-specific device-only SecureStore, and returns the staging
 * writer. Methods must be called sequentially.
 */
export function initStaging(): Effect.Effect<
  DeviceMigrationStaging,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    const directoryUri = yield* _(stagingDirectoryUri())

    yield* _(deleteStagingVerified())
    yield* _(
      Effect.try({
        try: () => {
          new Directory(directoryUri).create({
            intermediates: true,
            idempotent: true,
          })
        },
        catch: () => err('transportFailed'),
      })
    )

    const stagingKey = yield* _(
      Effect.tryPromise({
        try: async () => await generateRandomBytes(STAGING_KEY_BYTES),
        catch: () => err('transportFailed'),
      })
    )
    yield* _(
      saveMigrationSecret('stagingKey')(Base64.fromUint8Array(stagingKey))
    )

    const index: {
      manifestBlob: string | undefined
      sessionBlob: string | undefined
      entryBlobs: Record<string, string>
      fileBlobs: Record<string, string>
    } = {
      manifestBlob: undefined,
      sessionBlob: undefined,
      entryBlobs: {},
      fileBlobs: {},
    }
    let stagedManifest: SnapshotManifest | undefined
    const inProgressFiles = new Map<string, InProgressStagedFile>()

    const randomBlobName = (): Effect.Effect<string, DeviceMigrationError> =>
      Effect.tryPromise({
        try: async () => await generateRandomBase64Url(RANDOM_BLOB_NAME_BYTES),
        catch: () => err('transportFailed'),
      })

    const persistIndex = (): Effect.Effect<void, DeviceMigrationError> =>
      writeEncryptedBlob({
        key: stagingKey,
        fileUri: Paths.join(directoryUri, STAGING_INDEX_FILE_NAME),
        plaintext: utf8Encode(
          encodeStagingIndex({
            ...(index.manifestBlob !== undefined
              ? {manifestBlob: index.manifestBlob}
              : {}),
            ...(index.sessionBlob !== undefined
              ? {sessionBlob: index.sessionBlob}
              : {}),
            entryBlobs: index.entryBlobs,
            fileBlobs: index.fileBlobs,
          })
        ),
      })

    const writeBlob = (
      blobName: string,
      plaintext: Uint8Array
    ): Effect.Effect<void, DeviceMigrationError> =>
      writeEncryptedBlob({
        key: stagingKey,
        fileUri: Paths.join(directoryUri, blobName),
        plaintext,
      })

    const requireManifest = (): Effect.Effect<
      SnapshotManifest,
      DeviceMigrationError
    > =>
      stagedManifest === undefined
        ? Effect.fail(err('stateInvalid'))
        : Effect.succeed(stagedManifest)

    const stageManifest = (
      manifest: SnapshotManifest
    ): Effect.Effect<void, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        if (stagedManifest !== undefined)
          return yield* _(Effect.fail(err('stateInvalid')))

        if (
          manifest.protocolVersion !== CURRENT_MIGRATION_PROTOCOL_VERSION ||
          manifest.storageSchemaVersion !==
            CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION
        )
          return yield* _(Effect.fail(err('versionMismatch')))

        const recomputedDigest = yield* _(
          Effect.try({
            try: () =>
              computeManifestDigest(toCanonicalManifestForDigest(manifest)),
            catch: () => err('schemaInvalid'),
          })
        )
        if (
          !constantTimeEqualStrings(recomputedDigest, manifest.manifestDigest)
        )
          return yield* _(Effect.fail(err('digestMismatch')))

        yield* _(freeDiskSpaceSufficient(manifest))

        const blobName = yield* _(randomBlobName())
        yield* _(writeBlob(blobName, utf8Encode(encodeManifest(manifest))))
        index.manifestBlob = blobName
        // Staging methods are a sequential sink; no concurrent call is valid.
        // eslint-disable-next-line require-atomic-updates
        stagedManifest = manifest
        yield* _(persistIndex())
      })

    const stageMmkvEntry = (
      entry: MmkvEntry
    ): Effect.Effect<void, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        const manifest = yield* _(requireManifest())
        const descriptor = manifest.mmkvEntries.find(
          (candidate) => candidate.key === entry.key
        )
        if (descriptor === undefined)
          return yield* _(Effect.fail(err('schemaInvalid')))
        if (descriptor.type !== entry.type)
          return yield* _(Effect.fail(err('schemaInvalid')))

        const valueBytes = mmkvEntryValueBytes(entry)
        if (
          valueBytes.length !== descriptor.byteLength ||
          !constantTimeEqualStrings(sha256HexOf(valueBytes), descriptor.sha256)
        )
          return yield* _(Effect.fail(err('digestMismatch')))

        const blobName = yield* _(randomBlobName())
        yield* _(writeBlob(blobName, utf8Encode(encodeMmkvEntry(entry))))
        index.entryBlobs[entry.key] = blobName
        yield* _(persistIndex())
      })

    const stageSessionJson = (
      sessionJson: string
    ): Effect.Effect<void, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        const manifest = yield* _(requireManifest())
        const sessionBytes = utf8Encode(sessionJson)
        if (
          sessionBytes.length !== manifest.session.byteLength ||
          !constantTimeEqualStrings(
            sha256HexOf(sessionBytes),
            manifest.session.sha256
          )
        )
          return yield* _(Effect.fail(err('digestMismatch')))

        const blobName = yield* _(randomBlobName())
        yield* _(writeBlob(blobName, sessionBytes))
        index.sessionBlob = blobName
        yield* _(persistIndex())
      })

    const openInProgressFile = (
      path: NormalizedRelativeFilePath
    ): Effect.Effect<InProgressStagedFile, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        const existing = inProgressFiles.get(path)
        if (existing !== undefined) return existing

        const blobName = yield* _(randomBlobName())
        const opened = yield* _(
          Effect.tryPromise({
            try: async () => {
              const encrypt = await createEncryptStream(stagingKey)
              const file = new File(Paths.join(directoryUri, blobName))
              file.create({intermediates: true, overwrite: true})
              const handle = file.open(FileMode.Truncate)
              handle.writeBytes(encrypt.header)
              return {handle, encrypt}
            },
            catch: () => err('transportFailed'),
          })
        )
        const inProgress: InProgressStagedFile = {
          blobName,
          handle: opened.handle,
          encrypt: opened.encrypt,
          hash: createSha256(),
          written: 0,
          pendingChunk: undefined,
        }
        inProgressFiles.set(path, inProgress)
        return inProgress
      })

    const findFileDescriptor = (
      manifest: SnapshotManifest,
      path: NormalizedRelativeFilePath
    ): FileDescriptor | undefined =>
      manifest.files.find((candidate) => candidate.path === path)

    const appendFileChunk = (
      path: NormalizedRelativeFilePath,
      bytes: Uint8Array
    ): Effect.Effect<void, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        const manifest = yield* _(requireManifest())
        const descriptor = findFileDescriptor(manifest, path)
        if (descriptor === undefined)
          return yield* _(Effect.fail(err('schemaInvalid')))
        if (bytes.length > MAX_DATA_CHUNK_PLAINTEXT_BYTES)
          return yield* _(Effect.fail(err('limitExceeded')))
        if (index.fileBlobs[path] !== undefined)
          return yield* _(Effect.fail(err('stateInvalid')))

        const inProgress = yield* _(openInProgressFile(path))
        if (inProgress.written + bytes.length > descriptor.byteLength)
          return yield* _(Effect.fail(err('limitExceeded')))

        yield* _(
          Effect.try({
            try: () => {
              // One-chunk lookahead: the previous chunk is only sealed as a
              // non-final frame once we know another one follows —
              // finalizeFile seals the last chunk with the final tag.
              if (inProgress.pendingChunk !== undefined) {
                writeFrame(
                  inProgress.handle,
                  inProgress.encrypt.push(inProgress.pendingChunk, false)
                )
              }
              inProgress.pendingChunk = bytes
              inProgress.hash.update(bytes)
              inProgress.written += bytes.length
            },
            catch: () => err('transportFailed'),
          })
        )
      })

    const finalizeFile = (
      path: NormalizedRelativeFilePath
    ): Effect.Effect<void, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        const manifest = yield* _(requireManifest())
        const descriptor = findFileDescriptor(manifest, path)
        if (descriptor === undefined)
          return yield* _(Effect.fail(err('schemaInvalid')))
        if (index.fileBlobs[path] !== undefined)
          return yield* _(Effect.fail(err('stateInvalid')))

        // Zero-byte files are finalized without any prior chunk.
        const inProgress = yield* _(openInProgressFile(path))

        const finalized = yield* _(
          Effect.try({
            try: () => {
              writeFrame(
                inProgress.handle,
                inProgress.encrypt.push(
                  inProgress.pendingChunk ?? new Uint8Array(0),
                  true
                )
              )
              inProgress.handle.close()
              return {
                written: inProgress.written,
                sha256Hex: bytesToHex(inProgress.hash.digest()),
              }
            },
            catch: () => err('transportFailed'),
          })
        )
        inProgressFiles.delete(path)

        if (
          finalized.written !== descriptor.byteLength ||
          !constantTimeEqualStrings(finalized.sha256Hex, descriptor.sha256)
        )
          return yield* _(Effect.fail(err('digestMismatch')))

        // Staging methods are a sequential sink; no concurrent call is valid.
        // eslint-disable-next-line require-atomic-updates
        index.fileBlobs[path] = inProgress.blobName
        yield* _(persistIndex())
      })

    return {
      stageManifest,
      stageMmkvEntry,
      stageSessionJson,
      appendFileChunk,
      finalizeFile,
    }
  })
}

// ---------------------------------------------------------------------------
// Staged snapshot reading
// ---------------------------------------------------------------------------

export interface StagedSnapshotReader {
  readonly manifest: SnapshotManifest
  readonly readMmkvEntry: (
    key: string
  ) => Effect.Effect<MmkvEntry, DeviceMigrationError>
  readonly readSessionJson: () => Effect.Effect<string, DeviceMigrationError>
  /**
   * Streams one staged file's plaintext in bounded chunks while verifying
   * its SHA-256 and byte length against the manifest descriptor.
   */
  readonly readFileChunks: (
    path: NormalizedRelativeFilePath,
    onChunk: (bytes: Uint8Array) => void
  ) => Effect.Effect<void, DeviceMigrationError>
}

interface LoadedStaging {
  readonly stagingKey: Uint8Array
  readonly directoryUri: string
  readonly index: StagingIndex
}

function loadStaging(): Effect.Effect<LoadedStaging, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const stagingKey = yield* _(loadStagingKey())
    const directoryUri = yield* _(stagingDirectoryUri())
    const indexBytes = yield* _(
      readEncryptedBlob({
        key: stagingKey,
        fileUri: Paths.join(directoryUri, STAGING_INDEX_FILE_NAME),
      })
    )
    const index = decodeStagingIndex(utf8Decode(indexBytes))
    if (Either.isLeft(index))
      return yield* _(Effect.fail(err('stagingIncomplete')))
    return {stagingKey, directoryUri, index: index.right}
  })
}

/**
 * Opens the durable staging package for reading (used by the installer and
 * by `verifyStagingComplete`). Every read re-validates the requested record
 * against the staged manifest.
 */
export function openStagedSnapshot(): Effect.Effect<
  StagedSnapshotReader,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    const staging = yield* _(loadStaging())
    const {stagingKey, directoryUri, index} = staging

    if (index.manifestBlob === undefined)
      return yield* _(Effect.fail(err('stagingIncomplete')))
    const manifestBytes = yield* _(
      readEncryptedBlob({
        key: stagingKey,
        fileUri: Paths.join(directoryUri, index.manifestBlob),
      })
    )
    const decodedManifest = decodeManifest(utf8Decode(manifestBytes))
    if (Either.isLeft(decodedManifest))
      return yield* _(Effect.fail(err('stagingIncomplete')))
    const manifest = decodedManifest.right

    const readMmkvEntry = (
      key: string
    ): Effect.Effect<MmkvEntry, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        const blobName = index.entryBlobs[key]
        if (blobName === undefined)
          return yield* _(Effect.fail(err('stagingIncomplete')))
        const bytes = yield* _(
          readEncryptedBlob({
            key: stagingKey,
            fileUri: Paths.join(directoryUri, blobName),
          })
        )
        const entry = decodeMmkvEntry(utf8Decode(bytes))
        if (Either.isLeft(entry))
          return yield* _(Effect.fail(err('schemaInvalid')))
        if (entry.right.key !== key)
          return yield* _(Effect.fail(err('stagingIncomplete')))
        return entry.right
      })

    const readSessionJson = (): Effect.Effect<string, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        if (index.sessionBlob === undefined)
          return yield* _(Effect.fail(err('stagingIncomplete')))
        const bytes = yield* _(
          readEncryptedBlob({
            key: stagingKey,
            fileUri: Paths.join(directoryUri, index.sessionBlob),
          })
        )
        return utf8Decode(bytes)
      })

    const readFileChunks = (
      path: NormalizedRelativeFilePath,
      onChunk: (bytes: Uint8Array) => void
    ): Effect.Effect<void, DeviceMigrationError> =>
      Effect.gen(function* (_) {
        const descriptor = manifest.files.find(
          (candidate) => candidate.path === path
        )
        const blobName = index.fileBlobs[path]
        if (descriptor === undefined || blobName === undefined)
          return yield* _(Effect.fail(err('stagingIncomplete')))

        const hash = createSha256()
        let byteLength = 0
        yield* _(
          streamDecryptBlob({
            key: stagingKey,
            fileUri: Paths.join(directoryUri, blobName),
            onChunk: (bytes) => {
              hash.update(bytes)
              byteLength += bytes.length
              onChunk(bytes)
            },
          })
        )
        if (
          byteLength !== descriptor.byteLength ||
          !constantTimeEqualStrings(
            bytesToHex(hash.digest()),
            descriptor.sha256
          )
        )
          return yield* _(Effect.fail(err('digestMismatch')))
      })

    return {
      manifest,
      readMmkvEntry,
      readSessionJson,
      readFileChunks,
    }
  })
}

// ---------------------------------------------------------------------------
// Full re-read verification
// ---------------------------------------------------------------------------

export interface VerifiedStagedSnapshot {
  readonly manifest: SnapshotManifest
}

/**
 * The spec's mandatory re-read before the erase-command QR may be created:
 * re-reads EVERYTHING from disk (index, manifest, every entry, the session,
 * every file), re-validates every schema, policy, per-record hash and
 * length, recomputes the manifest digest and the snapshot content digest,
 * and compares them (constant time) against the staged manifest.
 */
export function verifyStagingComplete(): Effect.Effect<
  VerifiedStagedSnapshot,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    const reader = yield* _(openStagedSnapshot())
    const manifest = reader.manifest

    const recomputedManifestDigest = yield* _(
      Effect.try({
        try: () =>
          computeManifestDigest(toCanonicalManifestForDigest(manifest)),
        catch: () => err('schemaInvalid'),
      })
    )
    if (
      !constantTimeEqualStrings(
        recomputedManifestDigest,
        manifest.manifestDigest
      )
    )
      return yield* _(Effect.fail(err('digestMismatch')))

    if (
      manifest.protocolVersion !== CURRENT_MIGRATION_PROTOCOL_VERSION ||
      manifest.storageSchemaVersion !== CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION
    )
      return yield* _(Effect.fail(err('versionMismatch')))

    yield* _(freeDiskSpaceSufficient(manifest))

    const mmkvLeaves: MmkvSnapshotLeaf[] = []
    for (const descriptor of manifest.mmkvEntries) {
      const resolved = resolveMmkvKeyPolicy(descriptor.key)
      if (resolved === undefined)
        return yield* _(Effect.fail(err('unknownStorageKey')))
      if (
        !EXPORTED_MIGRATION_POLICIES.includes(resolved.policy) ||
        resolved.nativeType !== descriptor.type
      )
        return yield* _(Effect.fail(err('schemaInvalid')))

      const entry = yield* _(reader.readMmkvEntry(descriptor.key))
      if (entry.type !== descriptor.type)
        return yield* _(Effect.fail(err('schemaInvalid')))
      const valueBytes = mmkvEntryValueBytes(entry)
      if (
        valueBytes.length !== descriptor.byteLength ||
        !constantTimeEqualStrings(sha256HexOf(valueBytes), descriptor.sha256)
      )
        return yield* _(Effect.fail(err('digestMismatch')))
      mmkvLeaves.push({
        key: descriptor.key,
        byteLength: descriptor.byteLength,
        digest: computeLeafDigest(
          encodeMmkvLeaf({
            key: descriptor.key,
            nativeType: descriptor.type,
            declaredByteLength: descriptor.byteLength,
            valueBytes,
          })
        ),
      })
    }
    // Extra staged entries not covered by the manifest are a protocol
    // violation.
    for (const stagedKey of Object.keys(
      (yield* _(loadStaging())).index.entryBlobs
    )) {
      if (
        manifest.mmkvEntries.find(
          (descriptor) => descriptor.key === stagedKey
        ) === undefined
      )
        return yield* _(Effect.fail(err('stagingIncomplete')))
    }

    const sessionJson = yield* _(reader.readSessionJson())
    const sessionBytes = utf8Encode(sessionJson)
    if (
      sessionBytes.length !== manifest.session.byteLength ||
      !constantTimeEqualStrings(
        sha256HexOf(sessionBytes),
        manifest.session.sha256
      )
    )
      return yield* _(Effect.fail(err('digestMismatch')))

    // Session sanity: the staged logical session must decode through the
    // current session schema and pass the V2 sanity checks.
    const session = decodeSession(sessionJson)
    if (
      Either.isLeft(session) ||
      !isSessionV2(session.right) ||
      !sanityCheckSessionV2(session.right)
    )
      return yield* _(Effect.fail(err('sessionInvalid')))

    const sessionLeaf: SnapshotLeaf = {
      byteLength: manifest.session.byteLength,
      digest: computeLeafDigest(
        encodeSessionLeaf({
          declaredByteLength: manifest.session.byteLength,
          valueBytes: sessionBytes,
        })
      ),
    }

    const fileLeaves: FileSnapshotLeaf[] = []
    for (const descriptor of manifest.files) {
      const hash = createSha256()
      yield* _(
        reader.readFileChunks(descriptor.path, (bytes) => {
          hash.update(bytes)
        })
      )
      fileLeaves.push({
        path: descriptor.path,
        byteLength: descriptor.byteLength,
        digest: computeLeafDigest(
          encodeFileLeaf({
            path: descriptor.path,
            declaredByteLength: descriptor.byteLength,
            fileContentSha256: hash.digest(),
          })
        ),
      })
    }

    const recomputedContentDigest = yield* _(
      Effect.try({
        try: () =>
          computeSnapshotContentRoot({
            protocolVersion: manifest.protocolVersion,
            storageSchemaVersion: manifest.storageSchemaVersion,
            manifestDigest: manifest.manifestDigest,
            mmkvLeaves,
            sessionLeaf,
            fileLeaves,
          }),
        catch: () => err('schemaInvalid'),
      })
    )
    if (
      !constantTimeEqualStrings(
        recomputedContentDigest,
        manifest.snapshotContentDigest
      )
    )
      return yield* _(Effect.fail(err('digestMismatch')))

    return {manifest}
  })
}

// ---------------------------------------------------------------------------
// Deletion
// ---------------------------------------------------------------------------

/**
 * Deletes the staging directory and read-back verifies its absence.
 * Idempotent — an absent directory is a success. Fails with
 * `cleanupIncomplete` when the directory cannot be proven absent. The
 * staging key in SecureStore is deleted separately via
 * `deleteMigrationSecretsVerified` (controlStore/secrets.ts).
 */
export function deleteStagingVerified(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    const directoryUri = yield* _(stagingDirectoryUri())
    yield* _(
      Effect.try({
        try: () => {
          const directory = new Directory(directoryUri)
          if (directory.exists) directory.delete()
          if (new Directory(directoryUri).exists)
            throw new Error('still present')
        },
        catch: () => err('cleanupIncomplete'),
      })
    )
  })
}

/** Sha256Hex helper shared with tests. */
export const sha256HexOfBytes = (bytes: Uint8Array): Sha256Hex =>
  Schema.decodeSync(Sha256Hex)(sha256HexOf(bytes))
