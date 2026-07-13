import {createSha256} from '@vexl-next/cryptography/src/operations/deviceMigration/sha256'
import {Sha256Hex} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {
  bytesToHex,
  compareBytes,
  utf8Encode,
} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {MAX_DATA_CHUNK_PLAINTEXT_BYTES} from '@vexl-next/domain/src/general/deviceMigration/limits'
import {
  CHAT_IMAGES_FILE_ROOT,
  NormalizedRelativeFilePath,
  PROFILE_PICTURE_FILE_ROOT,
} from '@vexl-next/domain/src/general/deviceMigration/snapshotEntries'
import {Array, Effect, Either, Order, pipe, Schema} from 'effect'
import {Directory, File, FileMode, Paths} from 'expo-file-system'
import {LEGACY_ROOT_PROFILE_PICTURE_REGEX} from './uriNormalization'

/**
 * File-system helpers shared by the snapshot exporter and installer. Only
 * the two approved migration roots (`chat-images/`, `profilePicture/`) plus
 * legacy Documents-root profile pictures are ever enumerated — the Documents
 * root also holds the raw MMKV database and log exports, which must never be
 * copied (spec section "Files and URI normalization").
 *
 * PRIVACY: paths, sizes and digests handled here are sensitive migration
 * metadata. Every failure surfaces as `DeviceMigrationError` with an
 * enumerated code only.
 */

export const APPROVED_MIGRATION_FILE_ROOTS: readonly string[] = [
  CHAT_IMAGES_FILE_ROOT,
  PROFILE_PICTURE_FILE_ROOT,
]

const decodeNormalizedRelativeFilePath = Schema.decodeUnknownEither(
  NormalizedRelativeFilePath
)

export interface EnumeratedSnapshotFile {
  readonly relativePath: NormalizedRelativeFilePath
  /** Absolute `file://` URI of the file on this device. */
  readonly uri: string
  readonly byteLength: number
}

export const byUtf8PathBytes: Order.Order<EnumeratedSnapshotFile> =
  Order.mapInput(
    Order.make(compareBytes),
    (file: EnumeratedSnapshotFile): Uint8Array => utf8Encode(file.relativePath)
  )

/** The application document directory, or `stateInvalid` when unavailable. */
export function documentDirectory(): Effect.Effect<
  Directory,
  DeviceMigrationError
> {
  return Effect.try({
    try: () => {
      const directory = Paths.document
      if (!directory) throw new Error('missing')
      return directory
    },
    catch: () => new DeviceMigrationError({code: 'stateInvalid'}),
  })
}

interface RawEnumeratedFile {
  relativePath: string
  uri: string
  byteLength: number
}

function collectFilesRecursively(
  directory: Directory,
  relativeSegments: readonly string[],
  into: RawEnumeratedFile[]
): void {
  for (const entry of directory.list()) {
    if (entry instanceof Directory) {
      collectFilesRecursively(entry, [...relativeSegments, entry.name], into)
    } else if (entry instanceof File) {
      into.push({
        relativePath: [...relativeSegments, entry.name].join('/'),
        uri: entry.uri,
        byteLength: entry.size,
      })
    }
  }
}

/**
 * Enumerates every file the migration exports:
 *
 * - everything under `Documents/chat-images/` (any nesting depth — raw
 *   base64 MD5 chat directory names can contain '/');
 * - everything under `Documents/profilePicture/`;
 * - legacy Documents-ROOT files matching `profilePicture*.<image ext>`
 *   (mis-placed by the old path-join bug), mapped to
 *   `profilePicture/<basename>`.
 *
 * The result is sorted by the UTF-8 bytes of the normalized relative path
 * (the snapshot content digest ordering). Fails with `pathInvalid` on paths
 * that do not validate against the approved roots or on duplicate /
 * case-folding-colliding normalized paths.
 */
export function enumerateApprovedMigrationFiles(): Effect.Effect<
  readonly EnumeratedSnapshotFile[],
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    const documents = yield* _(documentDirectory())

    const rawFiles = yield* _(
      Effect.try({
        try: () => {
          const collected: RawEnumeratedFile[] = []

          for (const root of APPROVED_MIGRATION_FILE_ROOTS) {
            const rootDirectory = new Directory(Paths.join(documents.uri, root))
            if (!rootDirectory.exists) continue
            collectFilesRecursively(rootDirectory, [root], collected)
          }

          // Legacy root-level profile pictures (see uriNormalization.ts).
          for (const entry of documents.list()) {
            if (
              entry instanceof File &&
              LEGACY_ROOT_PROFILE_PICTURE_REGEX.test(entry.name)
            ) {
              collected.push({
                relativePath: `${PROFILE_PICTURE_FILE_ROOT}/${entry.name}`,
                uri: entry.uri,
                byteLength: entry.size,
              })
            }
          }

          return collected
        },
        catch: () => new DeviceMigrationError({code: 'transportFailed'}),
      })
    )

    const validated: EnumeratedSnapshotFile[] = []
    for (const file of rawFiles) {
      const relativePath = decodeNormalizedRelativeFilePath(file.relativePath)
      if (Either.isLeft(relativePath))
        return yield* _(
          Effect.fail(new DeviceMigrationError({code: 'pathInvalid'}))
        )
      validated.push({
        relativePath: relativePath.right,
        uri: file.uri,
        byteLength: file.byteLength,
      })
    }

    // Duplicate normalized paths (e.g. a legacy root file colliding with a
    // real profilePicture/ file) and case-folding collisions would silently
    // merge files on case-insensitive filesystems.
    const lowerCasePaths = pipe(
      validated,
      Array.map((file) => file.relativePath.toLowerCase())
    )
    if (new Set(lowerCasePaths).size !== lowerCasePaths.length)
      return yield* _(
        Effect.fail(new DeviceMigrationError({code: 'pathInvalid'}))
      )

    return pipe(validated, Array.sort(byUtf8PathBytes))
  })
}

export interface StreamedFileDigest {
  readonly digestBytes: Uint8Array
  readonly sha256: Sha256Hex
  readonly byteLength: number
}

/**
 * Streams one file through SHA-256 in bounded ≤64 KiB chunks — the whole
 * file is never held in memory. The optional `onChunk` callback receives
 * every chunk (used by the exporter's record stream).
 */
export function streamFileSha256(
  fileUri: string,
  onChunk?: (bytes: Uint8Array) => void
): Effect.Effect<StreamedFileDigest, DeviceMigrationError> {
  return Effect.try({
    try: () => {
      const file = new File(fileUri)
      const handle = file.open(FileMode.ReadOnly)
      try {
        const hash = createSha256()
        let byteLength = 0

        while (true) {
          const chunk = handle.readBytes(MAX_DATA_CHUNK_PLAINTEXT_BYTES)
          if (chunk.length === 0) break
          hash.update(chunk)
          byteLength += chunk.length
          if (onChunk !== undefined) onChunk(chunk)
        }
        const digestBytes = hash.digest()
        return {
          digestBytes,
          sha256: Schema.decodeSync(Sha256Hex)(bytesToHex(digestBytes)),
          byteLength,
        }
      } finally {
        handle.close()
      }
    },
    catch: () => new DeviceMigrationError({code: 'transportFailed'}),
  })
}

/**
 * Creates (or truncates) one file and returns a writer that verifies the
 * declared byte length and SHA-256 while chunks are written. `writeSync`
 * throws on overflow or I/O failure (callers run it inside a sync chunk
 * callback and surface the failure through the surrounding Effect).
 * `finish()` fails with `digestMismatch` unless the written content matches
 * the declaration exactly.
 */
export interface VerifiedFileWriter {
  readonly writeSync: (bytes: Uint8Array) => void
  readonly finish: () => Effect.Effect<void, DeviceMigrationError>
  readonly abort: () => void
}

export function openVerifiedFileWriter(args: {
  readonly fileUri: string
  readonly expectedByteLength: number
  readonly expectedSha256: Sha256Hex
}): Effect.Effect<VerifiedFileWriter, DeviceMigrationError> {
  return Effect.try({
    try: () => {
      const file = new File(args.fileUri)
      file.create({intermediates: true, overwrite: true})
      const handle = file.open(FileMode.Truncate)
      const hash = createSha256()
      let written = 0
      let closed = false

      const closeQuietly = (): void => {
        if (closed) return
        closed = true
        try {
          handle.close()
        } catch {
          // Nothing sensible to do; verification reads the file back anyway.
        }
      }

      return {
        writeSync: (bytes: Uint8Array): void => {
          if (written + bytes.length > args.expectedByteLength) {
            closeQuietly()
            throw new DeviceMigrationError({code: 'digestMismatch'})
          }
          try {
            handle.writeBytes(bytes)
          } catch {
            closeQuietly()
            throw new DeviceMigrationError({code: 'transportFailed'})
          }
          hash.update(bytes)
          written += bytes.length
        },
        finish: () =>
          Effect.try({
            try: () => {
              closeQuietly()
              if (written !== args.expectedByteLength)
                throw new Error('length mismatch')
              const digestHex = bytesToHex(hash.digest())
              if (digestHex !== args.expectedSha256)
                throw new Error('digest mismatch')
            },
            catch: () => new DeviceMigrationError({code: 'digestMismatch'}),
          }),
        abort: closeQuietly,
      }
    },
    catch: () => new DeviceMigrationError({code: 'transportFailed'}),
  })
}

/**
 * Creates every intermediate directory of one normalized relative path under
 * the given root directory URI.
 */
export function ensureParentDirectories(args: {
  readonly rootDirectoryUri: string
  readonly relativePath: NormalizedRelativeFilePath
}): Effect.Effect<void, DeviceMigrationError> {
  return Effect.try({
    try: () => {
      const segments = args.relativePath.split('/')
      const directorySegments = segments.slice(0, -1)
      if (directorySegments.length === 0) return
      const directory = new Directory(
        Paths.join(args.rootDirectoryUri, ...directorySegments)
      )
      if (!directory.exists)
        directory.create({intermediates: true, idempotent: true})
    },
    catch: () => new DeviceMigrationError({code: 'transportFailed'}),
  })
}

/**
 * Deletes only the approved account-media roots and legacy root profile
 * pictures, then proves them absent. The default MMKV files and log exports
 * in Documents are never touched.
 */
export function deleteApprovedMigrationFilesVerified(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  return documentDirectory().pipe(
    Effect.flatMap((documents) =>
      Effect.try({
        try: () => {
          for (const root of APPROVED_MIGRATION_FILE_ROOTS) {
            const directory = new Directory(Paths.join(documents.uri, root))
            if (directory.exists) directory.delete()
            if (new Directory(Paths.join(documents.uri, root)).exists)
              throw new Error('directory remains')
          }
          for (const entry of documents.list()) {
            if (
              entry instanceof File &&
              LEGACY_ROOT_PROFILE_PICTURE_REGEX.test(entry.name)
            )
              entry.delete()
          }
          for (const entry of documents.list()) {
            if (
              entry instanceof File &&
              LEGACY_ROOT_PROFILE_PICTURE_REGEX.test(entry.name)
            )
              throw new Error('legacy file remains')
          }
        },
        catch: () => new DeviceMigrationError({code: 'cleanupIncomplete'}),
      })
    )
  )
}
