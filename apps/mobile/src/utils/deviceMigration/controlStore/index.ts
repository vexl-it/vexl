import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Either, Schema} from 'effect'
import {MMKV} from 'react-native-mmkv'
import {
  LEGAL_MIGRATION_CONTROL_TRANSITIONS,
  MigrationControlRecord,
  NORMAL_MIGRATION_CONTROL_RECORD,
  type MigrationControlMode,
  type MigrationControlReadResult,
  type QuarantinedMigrationControlRecord,
} from './domain'

export {needsManualRecovery} from './domain'

/**
 * Dedicated, NON-DEFAULT MMKV instance holding the durable migration control
 * record (spec section "Application execution modes"). Deliberately minimal
 * and fully synchronous: it must be readable before Jotai state exists, from
 * headless launches and before the normal splash/session loader mounts.
 *
 * It is a separate MMKV id so it is never enumerated by the snapshot
 * exporter (which only reads the default instance) and survives source
 * account-data cleanup (`clearAll` on the default instance) and destination
 * installation.
 *
 * PRIVACY: the record contains sensitive migration metadata (digests,
 * transfer id, local endpoints). Nothing read from or written to this store
 * may ever be passed to reportError/Sentry/console or any Vexl request. All
 * failures surface as `DeviceMigrationError` with an enumerated code only.
 */
export const MIGRATION_CONTROL_MMKV_ID = 'vexl-device-migration-control'
export const MIGRATION_CONTROL_RECORD_KEY = 'migrationControlRecord'

// Exported for tests only — production code must go through the functions
// below.
export const migrationControlStorage = new MMKV({
  id: MIGRATION_CONTROL_MMKV_ID,
})

const QUARANTINED_MIGRATION_CONTROL_RECORD: QuarantinedMigrationControlRecord =
  {
    mode: 'recoveryRequired',
  }

const encodeRecord = Schema.encodeSync(Schema.parseJson(MigrationControlRecord))
const decodeRecordEither = Schema.decodeUnknownEither(
  Schema.parseJson(MigrationControlRecord)
)

// Cache keyed by the raw stored string so repeated reads of an unchanged
// store return a referentially stable record (required by
// useSyncExternalStore's getSnapshot).
let decodeCache: {raw: string; result: MigrationControlReadResult} | undefined

const decodeCached = (raw: string): MigrationControlReadResult => {
  if (decodeCache !== undefined && decodeCache.raw === raw)
    return decodeCache.result
  const result = Either.match(decodeRecordEither(raw), {
    // A value exists but cannot be validated. It must NOT silently become
    // 'normal' — corrupt data in a migration-critical state (e.g. after the
    // source committed retirement) booting normally would violate the spec's
    // hard invariants. Quarantine instead; see needsManualRecovery.
    onLeft: (): MigrationControlReadResult =>
      QUARANTINED_MIGRATION_CONTROL_RECORD,
    onRight: (record): MigrationControlReadResult => record,
  })
  decodeCache = {raw, result}
  return result
}

/**
 * Synchronously reads and validates the migration control record.
 *
 * - Absent record → `{mode: 'normal'}` (the ordinary case on every boot).
 * - Present and valid → the validated record.
 * - Present but corrupt/unreadable → `{mode: 'recoveryRequired'}` quarantine
 *   (never 'normal'; see {@link needsManualRecovery}).
 */
export function readMigrationControlRecord(): MigrationControlReadResult {
  try {
    if (!migrationControlStorage.contains(MIGRATION_CONTROL_RECORD_KEY))
      return NORMAL_MIGRATION_CONTROL_RECORD

    const raw = migrationControlStorage.getString(MIGRATION_CONTROL_RECORD_KEY)
    // The key exists but does not hold a string (foreign/corrupt write).
    if (raw === undefined) return QUARANTINED_MIGRATION_CONTROL_RECORD

    return decodeCached(raw)
  } catch {
    // Reading the store failed entirely. Fail closed — we cannot prove the
    // device is not mid-migration.
    return QUARANTINED_MIGRATION_CONTROL_RECORD
  }
}

/**
 * Synchronously persists the control record and read-back verifies the
 * stored bytes. Throws `DeviceMigrationError` ('schemaInvalid' when the
 * record cannot be encoded, 'stateInvalid' when the write or its read-back
 * verification fails). Callers advancing the state machine should prefer
 * {@link transitionMigrationControl}.
 */
export function writeMigrationControlRecord(
  record: MigrationControlRecord
): void {
  let encoded: string
  try {
    encoded = encodeRecord(record)
  } catch {
    throw new DeviceMigrationError({code: 'schemaInvalid'})
  }

  try {
    migrationControlStorage.set(MIGRATION_CONTROL_RECORD_KEY, encoded)
  } catch {
    throw new DeviceMigrationError({code: 'stateInvalid'})
  }

  let readBack: string | undefined
  try {
    readBack = migrationControlStorage.getString(MIGRATION_CONTROL_RECORD_KEY)
  } catch {
    readBack = undefined
  }
  if (readBack !== encoded)
    throw new DeviceMigrationError({code: 'stateInvalid'})
}

/**
 * Deletes the control record (equivalent to returning to 'normal' by
 * absence) and read-back verifies the deletion.
 *
 * Clearing is a transition to 'normal', so it is legal only from modes whose
 * transition graph allows 'normal' (safe cancellation and the two terminal
 * completion states). In particular it is REFUSED from
 * `sourceRetirementCommitted` onwards — the source must finish retirement —
 * and from a quarantined record, which requires explicit recovery handling.
 * Throws `DeviceMigrationError('stateInvalid')` otherwise, or when deletion
 * cannot be verified.
 */
export function clearMigrationControlRecord(): void {
  const current = readMigrationControlRecord()
  if (current.mode === 'recoveryRequired')
    throw new DeviceMigrationError({code: 'stateInvalid'})
  if (
    current.mode !== 'normal' &&
    !LEGAL_MIGRATION_CONTROL_TRANSITIONS[current.mode].includes('normal')
  )
    throw new DeviceMigrationError({code: 'stateInvalid'})

  try {
    migrationControlStorage.delete(MIGRATION_CONTROL_RECORD_KEY)
  } catch {
    throw new DeviceMigrationError({code: 'stateInvalid'})
  }

  let stillPresent: boolean
  try {
    stillPresent = migrationControlStorage.contains(
      MIGRATION_CONTROL_RECORD_KEY
    )
  } catch {
    stillPresent = true
  }
  if (stillPresent) throw new DeviceMigrationError({code: 'stateInvalid'})
}

/**
 * Atomically-in-order advances the migration state machine:
 *
 * 1. the current mode must be one of `expectedCurrentModes`;
 * 2. `current mode → next.mode` must be a legal edge of
 *    {@link LEGAL_MIGRATION_CONTROL_TRANSITIONS};
 * 3. only then is `next` persisted (with read-back verification).
 *
 * A quarantined (corrupt) record refuses every transition. Throws
 * `DeviceMigrationError('stateInvalid')` on any violation.
 */
export function transitionMigrationControl(
  expectedCurrentModes: readonly MigrationControlMode[],
  next: MigrationControlRecord
): void {
  const current = readMigrationControlRecord()

  if (current.mode === 'recoveryRequired')
    throw new DeviceMigrationError({code: 'stateInvalid'})

  if (!expectedCurrentModes.includes(current.mode))
    throw new DeviceMigrationError({code: 'stateInvalid'})

  if (!LEGAL_MIGRATION_CONTROL_TRANSITIONS[current.mode].includes(next.mode))
    throw new DeviceMigrationError({code: 'stateInvalid'})

  writeMigrationControlRecord(next)
}

/**
 * Subscribes to changes of the control record (writes and deletions).
 * Returns an unsubscribe function. Used by the boot gate's
 * useSyncExternalStore hook so leaving migration mode swaps roots without an
 * app restart.
 */
export function subscribeToMigrationControlRecord(
  listener: () => void
): () => void {
  const subscription = migrationControlStorage.addOnValueChangedListener(
    (changedKey) => {
      if (changedKey === MIGRATION_CONTROL_RECORD_KEY) listener()
    }
  )
  return () => {
    subscription.remove()
  }
}
