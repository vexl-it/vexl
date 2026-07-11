import {
  createSha256,
  sha256Bytes,
  type Sha256Stream,
} from '@vexl-next/cryptography/src/operations/deviceMigration/sha256'
import {
  Sha256Hex,
  type ManifestDigest,
  type SnapshotContentDigest,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
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
  compareBytes,
  utf8Encode,
} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  MAX_DATA_CHUNK_PLAINTEXT_BYTES,
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  MAX_MMKV_ENTRY_COUNT,
  MAX_MMKV_VALUE_BYTES,
  MAX_TOTAL_SNAPSHOT_BYTES,
} from '@vexl-next/domain/src/general/deviceMigration/limits'
import {
  MmkvEntry,
  type MmkvEntryKey,
  type MmkvNativeType,
  type NormalizedRelativeFilePath,
} from '@vexl-next/domain/src/general/deviceMigration/snapshotEntries'
import {
  SnapshotManifest,
  type CanonicalManifestForDigest,
  type FileDescriptor,
  type MmkvEntryDescriptor,
  type SnapshotSessionDescriptor,
} from '@vexl-next/domain/src/general/deviceMigration/snapshotManifest'
import {
  CURRENT_MIGRATION_PROTOCOL_VERSION,
  CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
} from '@vexl-next/domain/src/general/deviceMigration/version'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, Either, Option, Order, pipe, Schema} from 'effect'
import {File, FileMode, type FileHandle} from 'expo-file-system'
import {getDefaultStore} from 'jotai'
import {Base64} from 'js-base64'
import {
  isSessionV2,
  sanityCheckSessionV2,
  Session,
} from '../../../brands/Session.brand'
import {VexlNotificationSecretState} from '../../../state/notifications/vexlNotificationTokenAtom'
import {sessionHolderAtom} from '../../../state/session'
import {TradeRemindersState} from '../../../state/tradeReminders/domain'
import {
  flushAllPendingMmkvWrites,
  isMmkvPersistenceFrozen,
  resolveMmkvKeyPolicy,
} from '../../atomUtils/mmkvMigrationRegistry'
import {version as currentAppVersion} from '../../environment'
import {storage} from '../../mmkv/effectMmkv'
import {Preferences} from '../../preferences/domain'
import {readMigrationControlRecord} from '../controlStore'
import {EXPORTED_MIGRATION_POLICIES} from './constants'
// Imported for its side effects: makes every persisted key's registration
// deterministic regardless of which screens were mounted before migration
// (Metro inline-requires evaluate modules lazily).
import './ensurePersistenceModulesRegistered'
import {
  documentDirectory,
  enumerateApprovedMigrationFiles,
  streamFileSha256,
  type EnumeratedSnapshotFile,
} from './snapshotFileSystem'
import {normalizePersistedValueUris} from './uriNormalization'

/**
 * Snapshot exporter (spec sections "Snapshot format", "Typed MMKV entries",
 * "Snapshot consistency"). Runs on the SOURCE device after quiescence, with
 * MMKV persistence frozen, and produces:
 *
 * - the complete `SnapshotManifest` (typed entry/session/file descriptors,
 *   counts, manifest digest and snapshot content digest), and
 * - a pull-based record stream the protocol layer consumes to send the
 *   snapshot over the encrypted local connection.
 *
 * The full snapshot is never materialized in memory: file bytes stream from
 * disk in ≤64 KiB chunks, and MMKV values are (re-)read one entry at a time.
 *
 * PRIVACY: manifests, digests, counts, values and paths handled here are
 * sensitive migration data. Every failure surfaces as
 * `DeviceMigrationError` with an enumerated code only.
 */

export {EXPORTED_MIGRATION_POLICIES}

/** Control modes the exporter may run in. */
export const EXPORT_ALLOWED_CONTROL_MODES: ReadonlyArray<
  'sourceServing' | 'sourceSnapshotSent'
> = ['sourceServing', 'sourceSnapshotSent']

export type SnapshotExportRecord =
  | {
      readonly kind: 'mmkvEntryStart'
      readonly key: MmkvEntryKey
      readonly nativeType: MmkvNativeType
      readonly byteLength: number
    }
  | {readonly kind: 'dataChunk'; readonly bytes: Uint8Array}
  | {
      readonly kind: 'mmkvEntryEnd'
      readonly key: MmkvEntryKey
      readonly sha256: Sha256Hex
    }
  | {readonly kind: 'sessionStart'; readonly byteLength: number}
  | {readonly kind: 'sessionEnd'; readonly sha256: Sha256Hex}
  | {
      readonly kind: 'fileStart'
      readonly path: NormalizedRelativeFilePath
      readonly byteLength: number
    }
  | {
      readonly kind: 'fileEnd'
      readonly path: NormalizedRelativeFilePath
      readonly sha256: Sha256Hex
    }
  | {
      readonly kind: 'snapshotEnd'
      readonly manifestDigest: ManifestDigest
      readonly snapshotContentDigest: SnapshotContentDigest
    }

export interface SnapshotExport {
  readonly manifest: SnapshotManifest
  /**
   * Pulls the next snapshot record. Records arrive in canonical order (MMKV
   * entries by UTF-8 key bytes, the logical session, files by UTF-8 path
   * bytes, then `snapshotEnd`), each entry/file wrapped in start/chunk/end
   * records with ≤64 KiB chunks. Returns `Option.none()` after
   * `snapshotEnd`. Must be called sequentially — the stream keeps a file
   * handle open between calls.
   */
  readonly nextRecord: () => Effect.Effect<
    Option.Option<SnapshotExportRecord>,
    DeviceMigrationError
  >
}

const decodeMmkvEntry = Schema.decodeUnknownEither(MmkvEntry)
const decodeManifest = Schema.decodeUnknownEither(SnapshotManifest)
const encodeSession = Schema.encodeEither(Schema.parseJson(Session))

const schemaInvalid = (): DeviceMigrationError =>
  new DeviceMigrationError({code: 'schemaInvalid'})

// ---------------------------------------------------------------------------
// Per-key export transforms
// ---------------------------------------------------------------------------

const decodeVexlNotificationTokenValue = Schema.decodeEither(
  Schema.parseJson(VexlNotificationSecretState)
)
const encodeVexlNotificationTokenValue = Schema.encodeEither(
  Schema.parseJson(VexlNotificationSecretState)
)
const decodePreferencesValue = Schema.decodeEither(
  Schema.parseJson(Preferences)
)
const encodePreferencesValue = Schema.encodeEither(
  Schema.parseJson(Preferences)
)
const decodeTradeRemindersValue = Schema.decodeEither(
  Schema.parseJson(TradeRemindersState)
)
const encodeTradeRemindersValue = Schema.encodeEither(
  Schema.parseJson(TradeRemindersState)
)

/**
 * Placeholder written into `TradeReminder.notificationId` — the schema
 * requires a string, but source OS notification identifiers must never
 * migrate. The destination reschedules local notifications after activation
 * and overwrites this value.
 */
export const REMOVED_OS_NOTIFICATION_ID = ''

/**
 * Applies the per-key export transforms (spec section "Rebuild or split
 * before migration"):
 *
 * - `vexlNotificationToken`: keeps the stable secret and system/marketing
 *   tokens, strips `lastUpdatedMetadata` (contains the source Expo push
 *   token) so the destination's ordinary refresh re-uploads its own.
 * - `preferences`: keeps user-facing choices, resets the developer /
 *   diagnostic / task-debug fields (`isDeveloper`, `showTextDebugButton`,
 *   `enableNewOffersNotificationDevMode`, `runTasksInParallel`).
 * - `tradeReminders`: keeps logical chat/meeting/reminder times, drops the
 *   source OS `notificationId`s.
 *
 * Every transformed value is decoded through its real atom schema, so an
 * invalid stored value fails the snapshot instead of migrating garbage.
 * Values of other keys pass through unchanged.
 */
export function applyPerKeyExportTransform(
  key: string,
  jsonValue: string
): Either.Either<string, DeviceMigrationError> {
  if (key === 'vexlNotificationToken') {
    return pipe(
      decodeVexlNotificationTokenValue(jsonValue),
      Either.map((value) => ({...value, lastUpdatedMetadata: null})),
      Either.flatMap(encodeVexlNotificationTokenValue),
      Either.mapLeft(schemaInvalid)
    )
  }

  if (key === 'preferences') {
    return pipe(
      decodePreferencesValue(jsonValue),
      Either.map((value) => ({
        ...value,
        isDeveloper: false,
        showTextDebugButton: false,
        enableNewOffersNotificationDevMode: false,
        runTasksInParallel: true,
      })),
      Either.flatMap(encodePreferencesValue),
      Either.mapLeft(schemaInvalid)
    )
  }

  if (key === 'tradeReminders') {
    return pipe(
      decodeTradeRemindersValue(jsonValue),
      Either.map((value) => ({
        reminders: pipe(
          value.reminders,
          Array.map((reminder) => ({
            ...reminder,
            notificationId: REMOVED_OS_NOTIFICATION_ID,
          }))
        ),
      })),
      Either.flatMap(encodeTradeRemindersValue),
      Either.mapLeft(schemaInvalid)
    )
  }

  return Either.right(jsonValue)
}

// ---------------------------------------------------------------------------
// Typed MMKV reads
// ---------------------------------------------------------------------------

type RawTypedMmkvValue =
  | {readonly type: 'string'; readonly value: string}
  | {readonly type: 'boolean'; readonly value: boolean}
  | {readonly type: 'number'; readonly value: number}
  | {
      readonly type: 'buffer'
      readonly value: string
      readonly byteLength: number
    }

function readRawTypedMmkvValue(
  key: string,
  nativeType: MmkvNativeType
): Either.Either<RawTypedMmkvValue, DeviceMigrationError> {
  return Either.try({
    try: (): RawTypedMmkvValue => {
      if (nativeType === 'string') {
        const value = storage._storage.getString(key)
        if (value === undefined) throw new Error('not a string')
        return {type: 'string', value}
      }
      if (nativeType === 'boolean') {
        const value = storage._storage.getBoolean(key)
        if (value === undefined) throw new Error('not a boolean')
        return {type: 'boolean', value}
      }
      if (nativeType === 'number') {
        const value = storage._storage.getNumber(key)
        if (value === undefined) throw new Error('not a number')
        return {type: 'number', value}
      }
      const buffer = storage._storage.getBuffer(key)
      if (buffer === undefined) throw new Error('not a buffer')
      const bytes = new Uint8Array(buffer)
      return {
        type: 'buffer',
        value: Base64.fromUint8Array(bytes),
        byteLength: bytes.length,
      }
    },
    catch: schemaInvalid,
  })
}

/**
 * Reads, transforms, URI-normalizes and schema-validates one exported MMKV
 * entry. String values additionally pass a full JSON parse inside the URI
 * normalizer, so a non-JSON string value can never be exported.
 */
export function readExportedMmkvEntry(args: {
  readonly key: string
  readonly nativeType: MmkvNativeType
  readonly knownRootUris: readonly string[]
}): Either.Either<MmkvEntry, DeviceMigrationError> {
  return pipe(
    readRawTypedMmkvValue(args.key, args.nativeType),
    Either.flatMap(
      (raw): Either.Either<RawTypedMmkvValue, DeviceMigrationError> => {
        if (raw.type !== 'string') return Either.right(raw)
        return pipe(
          applyPerKeyExportTransform(args.key, raw.value),
          Either.flatMap((transformed) =>
            normalizePersistedValueUris(transformed, args.knownRootUris)
          ),
          Either.map(
            (normalized): RawTypedMmkvValue => ({
              type: 'string',
              value: normalized,
            })
          )
        )
      }
    ),
    Either.flatMap((raw) =>
      pipe(
        decodeMmkvEntry({
          type: raw.type,
          key: args.key,
          value: raw.value,
          ...(raw.type === 'buffer' ? {byteLength: raw.byteLength} : {}),
        }),
        Either.mapLeft(schemaInvalid)
      )
    )
  )
}

// ---------------------------------------------------------------------------
// Logical session
// ---------------------------------------------------------------------------

function readCanonicalSessionJson(
  knownRootUris: readonly string[]
): Either.Either<string, DeviceMigrationError> {
  const sessionState = getDefaultStore().get(sessionHolderAtom)
  if (sessionState.state !== 'loggedIn')
    return Either.left(new DeviceMigrationError({code: 'sessionInvalid'}))

  const session = sessionState.session
  if (!isSessionV2(session) || !sanityCheckSessionV2(session))
    return Either.left(new DeviceMigrationError({code: 'sessionInvalid'}))

  return pipe(
    encodeSession(session),
    Either.mapLeft(() => new DeviceMigrationError({code: 'sessionInvalid'})),
    Either.flatMap((sessionJson) =>
      normalizePersistedValueUris(sessionJson, knownRootUris)
    )
  )
}

// ---------------------------------------------------------------------------
// Export plan
// ---------------------------------------------------------------------------

interface PlannedMmkvEntry {
  readonly key: MmkvEntryKey
  readonly nativeType: MmkvNativeType
  readonly descriptor: MmkvEntryDescriptor
}

const byUtf8KeyBytes = Order.mapInput(
  Order.make(compareBytes),
  (entry: {readonly key: string}): Uint8Array => utf8Encode(entry.key)
)

function sha256HexOf(bytes: Uint8Array): Sha256Hex {
  return Schema.decodeSync(Sha256Hex)(bytesToHex(sha256Bytes(bytes)))
}

function checkPreconditions(): Effect.Effect<void, DeviceMigrationError> {
  return Effect.suspend(() => {
    if (!isMmkvPersistenceFrozen())
      return Effect.fail(new DeviceMigrationError({code: 'stateInvalid'}))
    const allowedModes: readonly string[] = EXPORT_ALLOWED_CONTROL_MODES
    if (!allowedModes.includes(readMigrationControlRecord().mode))
      return Effect.fail(new DeviceMigrationError({code: 'stateInvalid'}))
    return Effect.void
  })
}

function planMmkvEntries(
  knownRootUris: readonly string[]
): Effect.Effect<readonly PlannedMmkvEntry[], DeviceMigrationError> {
  return Effect.suspend(() => {
    let allKeys: readonly string[]
    try {
      allKeys = storage._storage.getAllKeys()
    } catch {
      return Effect.fail(new DeviceMigrationError({code: 'stateInvalid'}))
    }

    const planned: PlannedMmkvEntry[] = []
    for (const key of allKeys) {
      const resolved = resolveMmkvKeyPolicy(key)
      // An unknown key is never silently copied — it fails snapshot
      // creation (spec section "Typed MMKV entries").
      if (resolved === undefined)
        return Effect.fail(
          new DeviceMigrationError({code: 'unknownStorageKey'})
        )
      if (!EXPORTED_MIGRATION_POLICIES.includes(resolved.policy)) continue

      const entry = readExportedMmkvEntry({
        key,
        nativeType: resolved.nativeType,
        knownRootUris,
      })
      if (Either.isLeft(entry)) return Effect.fail(entry.left)

      const valueBytes = mmkvEntryValueBytes(entry.right)
      if (valueBytes.length > MAX_MMKV_VALUE_BYTES)
        return Effect.fail(new DeviceMigrationError({code: 'limitExceeded'}))

      planned.push({
        key: entry.right.key,
        nativeType: entry.right.type,
        descriptor: {
          key: entry.right.key,
          type: entry.right.type,
          byteLength: valueBytes.length,
          sha256: sha256HexOf(valueBytes),
        },
      })
    }

    if (planned.length > MAX_MMKV_ENTRY_COUNT)
      return Effect.fail(new DeviceMigrationError({code: 'limitExceeded'}))

    return Effect.succeed(pipe(planned, Array.sort(byUtf8KeyBytes)))
  })
}

interface PlannedFile {
  readonly file: EnumeratedSnapshotFile
  readonly descriptor: FileDescriptor
  readonly digestBytes: Uint8Array
}

function planFiles(): Effect.Effect<
  readonly PlannedFile[],
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    const files = yield* _(enumerateApprovedMigrationFiles())

    if (files.length > MAX_FILE_COUNT)
      return yield* _(
        Effect.fail(new DeviceMigrationError({code: 'limitExceeded'}))
      )

    const planned: PlannedFile[] = []
    for (const file of files) {
      const streamed = yield* _(streamFileSha256(file.uri))
      if (streamed.byteLength > MAX_FILE_BYTES)
        return yield* _(
          Effect.fail(new DeviceMigrationError({code: 'limitExceeded'}))
        )
      planned.push({
        file,
        descriptor: {
          path: file.relativePath,
          byteLength: streamed.byteLength,
          sha256: streamed.sha256,
        },
        digestBytes: streamed.digestBytes,
      })
    }
    return planned
  })
}

// ---------------------------------------------------------------------------
// Record stream
// ---------------------------------------------------------------------------

interface OpenFileStream {
  readonly nextChunk: () => Effect.Effect<
    Option.Option<Uint8Array>,
    DeviceMigrationError
  >
  readonly finish: () => Effect.Effect<Sha256Hex, DeviceMigrationError>
}

function openFileStream(fileUri: string): OpenFileStream {
  // Lazily opened on the first chunk so a failure between fileStart and the
  // first pull does not leak a handle.
  let state:
    | {phase: 'initial'}
    | {phase: 'open'; handle: FileHandle; hash: Sha256Stream}
    | {phase: 'done'; sha256: Sha256Hex} = {phase: 'initial'}

  return {
    nextChunk: () =>
      Effect.try({
        try: () => {
          if (state.phase === 'done') return Option.none()
          if (state.phase === 'initial') {
            state = {
              phase: 'open',
              handle: new File(fileUri).open(FileMode.ReadOnly),
              hash: createSha256(),
            }
          }
          const chunk = state.handle.readBytes(MAX_DATA_CHUNK_PLAINTEXT_BYTES)
          if (chunk.length === 0) {
            state.handle.close()
            const sha256 = Schema.decodeSync(Sha256Hex)(
              bytesToHex(state.hash.digest())
            )
            state = {phase: 'done', sha256}
            return Option.none()
          }
          state.hash.update(chunk)
          return Option.some(new Uint8Array(chunk))
        },
        catch: () => new DeviceMigrationError({code: 'transportFailed'}),
      }),
    finish: () =>
      Effect.suspend(() => {
        if (state.phase !== 'done')
          return Effect.fail(new DeviceMigrationError({code: 'stateInvalid'}))
        return Effect.succeed(state.sha256)
      }),
  }
}

function chunkBytes(bytes: Uint8Array): Uint8Array[] {
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

/**
 * Creates the complete snapshot export: computes descriptors and digests for
 * every MMKV entry, the logical session and every approved file, assembles
 * the finalized manifest, and returns the manifest together with the record
 * stream the protocol layer consumes.
 *
 * Preconditions (fail with `stateInvalid`):
 *
 * - MMKV persistence is frozen (`freezeMmkvPersistence`), and
 * - the migration control mode is `sourceServing` or `sourceSnapshotSent`.
 *
 * The stream re-reads every value lazily and verifies it still matches the
 * planned digest — any storage mutation between planning and streaming fails
 * the transfer with `digestMismatch` instead of exporting inconsistent data.
 */
export function createSnapshotExport(): Effect.Effect<
  SnapshotExport,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    yield* _(checkPreconditions())

    // Belt-and-suspenders: quiescence already flushed before freezing, but a
    // flush here is idempotent and free.
    yield* _(Effect.sync(flushAllPendingMmkvWrites))

    const documents = yield* _(documentDirectory())
    const knownRootUris = [documents.uri]

    const plannedEntries = yield* _(planMmkvEntries(knownRootUris))
    const sessionJson = yield* _(readCanonicalSessionJson(knownRootUris))
    const plannedFiles = yield* _(planFiles())

    const sessionBytes = utf8Encode(sessionJson)
    if (sessionBytes.length > MAX_MMKV_VALUE_BYTES)
      return yield* _(
        Effect.fail(new DeviceMigrationError({code: 'limitExceeded'}))
      )

    const sessionDescriptor: SnapshotSessionDescriptor = {
      byteLength: sessionBytes.length,
      sha256: sha256HexOf(sessionBytes),
    }

    const totalByteLength =
      pipe(
        plannedEntries,
        Array.reduce(0, (sum, entry) => sum + entry.descriptor.byteLength)
      ) +
      sessionDescriptor.byteLength +
      pipe(
        plannedFiles,
        Array.reduce(0, (sum, file) => sum + file.descriptor.byteLength)
      )
    if (totalByteLength > MAX_TOTAL_SNAPSHOT_BYTES)
      return yield* _(
        Effect.fail(new DeviceMigrationError({code: 'limitExceeded'}))
      )

    const canonicalManifest: CanonicalManifestForDigest = {
      snapshotSchemaVersion: 1,
      appVersion: currentAppVersion,
      storageSchemaVersion: CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
      protocolVersion: CURRENT_MIGRATION_PROTOCOL_VERSION,
      createdAt: unixMillisecondsNow(),
      mmkvEntries: pipe(
        plannedEntries,
        Array.map((entry) => entry.descriptor)
      ),
      session: sessionDescriptor,
      files: pipe(
        plannedFiles,
        Array.map((file) => file.descriptor)
      ),
      mmkvEntryCount: plannedEntries.length,
      fileCount: plannedFiles.length,
      totalByteLength,
    }

    const manifestDigest = yield* _(
      Effect.try({
        try: () => computeManifestDigest(canonicalManifest),
        catch: schemaInvalid,
      })
    )

    const mmkvLeaves: MmkvSnapshotLeaf[] = []
    for (const entry of plannedEntries) {
      // Leaves need the exact value bytes; re-read and re-verify so the leaf
      // always matches the descriptor.
      const reRead = readExportedMmkvEntry({
        key: entry.key,
        nativeType: entry.nativeType,
        knownRootUris,
      })
      if (Either.isLeft(reRead)) return yield* _(Effect.fail(reRead.left))
      const valueBytes = mmkvEntryValueBytes(reRead.right)
      if (sha256HexOf(valueBytes) !== entry.descriptor.sha256)
        return yield* _(
          Effect.fail(new DeviceMigrationError({code: 'digestMismatch'}))
        )
      mmkvLeaves.push({
        key: entry.key,
        byteLength: entry.descriptor.byteLength,
        digest: computeLeafDigest(
          encodeMmkvLeaf({
            key: entry.key,
            nativeType: entry.nativeType,
            declaredByteLength: entry.descriptor.byteLength,
            valueBytes,
          })
        ),
      })
    }

    const sessionLeaf: SnapshotLeaf = {
      byteLength: sessionDescriptor.byteLength,
      digest: computeLeafDigest(
        encodeSessionLeaf({
          declaredByteLength: sessionDescriptor.byteLength,
          valueBytes: sessionBytes,
        })
      ),
    }

    const fileLeaves: FileSnapshotLeaf[] = pipe(
      plannedFiles,
      Array.map(
        (planned): FileSnapshotLeaf => ({
          path: planned.descriptor.path,
          byteLength: planned.descriptor.byteLength,
          digest: computeLeafDigest(
            encodeFileLeaf({
              path: planned.descriptor.path,
              declaredByteLength: planned.descriptor.byteLength,
              fileContentSha256: planned.digestBytes,
            })
          ),
        })
      )
    )

    const snapshotContentDigest = yield* _(
      Effect.try({
        try: () =>
          computeSnapshotContentRoot({
            protocolVersion: CURRENT_MIGRATION_PROTOCOL_VERSION,
            storageSchemaVersion: CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
            manifestDigest,
            mmkvLeaves,
            sessionLeaf,
            fileLeaves,
          }),
        catch: schemaInvalid,
      })
    )

    const manifest = yield* _(
      pipe(
        decodeManifest({
          ...canonicalManifest,
          manifestDigest,
          snapshotContentDigest,
        }),
        Either.mapLeft(schemaInvalid)
      )
    )

    // -----------------------------------------------------------------------
    // Record stream state machine
    // -----------------------------------------------------------------------

    type StreamState =
      | {phase: 'entries'; index: number; queue: SnapshotExportRecord[]}
      | {phase: 'session'; queue: SnapshotExportRecord[]}
      | {
          phase: 'files'
          index: number
          started: boolean
          stream: OpenFileStream | undefined
        }
      | {phase: 'end'}
      | {phase: 'done'}

    let state: StreamState = {phase: 'entries', index: 0, queue: []}

    const produceEntryRecords = (
      planned: PlannedMmkvEntry
    ): Either.Either<SnapshotExportRecord[], DeviceMigrationError> =>
      pipe(
        readExportedMmkvEntry({
          key: planned.key,
          nativeType: planned.nativeType,
          knownRootUris,
        }),
        Either.flatMap((entry) => {
          const valueBytes = mmkvEntryValueBytes(entry)
          // Source persistence is read-only during export, so a mismatch
          // here means something mutated storage — fail instead of sending
          // data inconsistent with the manifest.
          if (sha256HexOf(valueBytes) !== planned.descriptor.sha256)
            return Either.left(
              new DeviceMigrationError({code: 'digestMismatch'})
            )
          return Either.right([
            {
              kind: 'mmkvEntryStart',
              key: planned.key,
              nativeType: planned.nativeType,
              byteLength: planned.descriptor.byteLength,
            },
            ...pipe(
              chunkBytes(valueBytes),
              Array.map(
                (bytes): SnapshotExportRecord => ({kind: 'dataChunk', bytes})
              )
            ),
            {
              kind: 'mmkvEntryEnd',
              key: planned.key,
              sha256: planned.descriptor.sha256,
            },
          ])
        })
      )

    const nextRecord = (): Effect.Effect<
      Option.Option<SnapshotExportRecord>,
      DeviceMigrationError
    > =>
      Effect.gen(function* (_) {
        for (;;) {
          if (state.phase === 'done') return Option.none()

          if (state.phase === 'entries') {
            const queuedRecord = state.queue.shift()
            if (queuedRecord !== undefined) return Option.some(queuedRecord)
            if (state.index >= plannedEntries.length) {
              state = {
                phase: 'session',
                queue: [
                  {
                    kind: 'sessionStart',
                    byteLength: sessionDescriptor.byteLength,
                  },
                  ...pipe(
                    chunkBytes(sessionBytes),
                    Array.map(
                      (bytes): SnapshotExportRecord => ({
                        kind: 'dataChunk',
                        bytes,
                      })
                    )
                  ),
                  {kind: 'sessionEnd', sha256: sessionDescriptor.sha256},
                ],
              }
              continue
            }
            const planned = plannedEntries[state.index]
            if (planned === undefined)
              return yield* _(
                Effect.fail(new DeviceMigrationError({code: 'stateInvalid'}))
              )
            const records = produceEntryRecords(planned)
            if (Either.isLeft(records))
              return yield* _(Effect.fail(records.left))
            state = {
              phase: 'entries',
              index: state.index + 1,
              queue: records.right,
            }
            continue
          }

          if (state.phase === 'session') {
            const queuedRecord = state.queue.shift()
            if (queuedRecord !== undefined) return Option.some(queuedRecord)
            state = {
              phase: 'files',
              index: 0,
              started: false,
              stream: undefined,
            }
            continue
          }

          if (state.phase === 'files') {
            if (state.index >= plannedFiles.length) {
              state = {phase: 'end'}
              continue
            }
            const planned = plannedFiles[state.index]
            if (planned === undefined)
              return yield* _(
                Effect.fail(new DeviceMigrationError({code: 'stateInvalid'}))
              )

            if (!state.started) {
              state = {
                ...state,
                started: true,
                stream: openFileStream(planned.file.uri),
              }
              return Option.some({
                kind: 'fileStart',
                path: planned.descriptor.path,
                byteLength: planned.descriptor.byteLength,
              })
            }

            const stream = state.stream
            if (stream === undefined)
              return yield* _(
                Effect.fail(new DeviceMigrationError({code: 'stateInvalid'}))
              )

            const chunk = yield* _(stream.nextChunk())
            if (Option.isSome(chunk))
              return Option.some({kind: 'dataChunk', bytes: chunk.value})

            const streamedSha256 = yield* _(stream.finish())
            // The file changed on disk between planning and streaming.
            if (streamedSha256 !== planned.descriptor.sha256)
              return yield* _(
                Effect.fail(new DeviceMigrationError({code: 'digestMismatch'}))
              )
            state = {
              phase: 'files',
              index: state.index + 1,
              started: false,
              stream: undefined,
            }
            return Option.some({
              kind: 'fileEnd',
              path: planned.descriptor.path,
              sha256: planned.descriptor.sha256,
            })
          }

          // state.phase === 'end'
          state = {phase: 'done'}
          return Option.some({
            kind: 'snapshotEnd',
            manifestDigest: manifest.manifestDigest,
            snapshotContentDigest: manifest.snapshotContentDigest,
          })
        }
      })

    return {manifest, nextRecord}
  })
}
