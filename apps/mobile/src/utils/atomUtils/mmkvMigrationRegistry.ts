import {
  type MigrationKeyPolicy,
  type MmkvNativeType,
} from '@vexl-next/domain/src/general/deviceMigration/snapshotEntries'
import {Schema} from 'effect'

/**
 * Module-level registry of every persisted MMKV key together with its device
 * migration policy and native MMKV value type (spec section "Migration policy
 * registry" in docs/device-migration-spec.md).
 *
 * The registry is deliberately dependency-free (no React, no Jotai, no MMKV
 * import) so it can be consulted from early boot code, headless launches and
 * the snapshot exporter without pulling in UI state.
 *
 * There is NO permissive default: a key that resolves to `undefined` must fail
 * snapshot creation.
 */

/**
 * Thrown when the same MMKV key (or dynamic key family prefix) is registered
 * twice with a different policy or native type. Two owners disagreeing about
 * a key's migration semantics is a programming error that must fail fast at
 * module initialization.
 */
export class MmkvKeyOwnershipConflictError extends Schema.TaggedError<MmkvKeyOwnershipConflictError>(
  'MmkvKeyOwnershipConflictError'
)('MmkvKeyOwnershipConflictError', {
  key: Schema.String,
  message: Schema.String,
}) {}

export interface ResolvedMmkvKeyPolicy {
  readonly policy: MigrationKeyPolicy
  readonly nativeType: MmkvNativeType
}

interface StaticKeyEntry {
  policy: MigrationKeyPolicy
  nativeType: MmkvNativeType
  note?: string
  flushFns: Set<() => void>
}

interface DynamicKeyFamilyEntry {
  prefix: string
  parseKey: (key: string) => boolean
  policy: MigrationKeyPolicy
  nativeType: MmkvNativeType
  note?: string
  /**
   * Flush fns of the per-key atom instances created for this family, keyed by
   * the full MMKV key. Dynamic atoms are recreated on every mount, so the
   * newest registration for a key replaces the previous one (the superseded
   * atom's already-scheduled deferred flush still runs on its own).
   */
  instanceFlushFns: Map<string, () => void>
}

const staticKeys = new Map<string, StaticKeyEntry>()
const dynamicKeyFamilies = new Map<string, DynamicKeyFamilyEntry>()

let persistenceFrozen = false

function findDynamicFamilyForKey(
  key: string
): DynamicKeyFamilyEntry | undefined {
  for (const family of dynamicKeyFamilies.values()) {
    if (family.parseKey(key)) return family
  }
  return undefined
}

/**
 * Registers one statically named persisted MMKV key.
 *
 * Repeated registration of the same key is tolerated as long as the policy and
 * native type match the previous registration (atoms for dynamic keys are
 * recreated per mount, and hot reload re-evaluates modules). Registering the
 * same key with a DIFFERENT policy or native type throws — a key must have
 * exactly one owner and one migration policy.
 *
 * When the key matches a registered dynamic key family, the registration is
 * recorded under that family instead (the policy/native type must match the
 * family's).
 */
export function registerMmkvKey({
  key,
  policy,
  nativeType,
  flushNow,
  note,
}: {
  key: string
  policy: MigrationKeyPolicy
  nativeType: MmkvNativeType
  /**
   * Synchronously persists this key's pending deferred write, if any. Omit
   * for keys written synchronously outside the atom system.
   */
  flushNow?: () => void
  /**
   * Free-form documentation of migration caveats for this key (e.g. fields
   * the exporter splits off before migrating).
   */
  note?: string
}): void {
  const family = findDynamicFamilyForKey(key)
  if (family !== undefined) {
    if (family.policy !== policy || family.nativeType !== nativeType) {
      throw new MmkvKeyOwnershipConflictError({
        key,
        message: `MMKV key '${key}' matches the dynamic key family '${family.prefix}' registered with policy '${family.policy}' / native type '${family.nativeType}' but was registered with policy '${policy}' / native type '${nativeType}'.`,
      })
    }
    if (flushNow !== undefined) family.instanceFlushFns.set(key, flushNow)
    return
  }

  const existing = staticKeys.get(key)
  if (existing !== undefined) {
    if (existing.policy !== policy || existing.nativeType !== nativeType) {
      throw new MmkvKeyOwnershipConflictError({
        key,
        message: `MMKV key '${key}' is already registered with policy '${existing.policy}' / native type '${existing.nativeType}' but was re-registered with policy '${policy}' / native type '${nativeType}'.`,
      })
    }
    if (flushNow !== undefined) existing.flushFns.add(flushNow)
    return
  }

  staticKeys.set(key, {
    policy,
    nativeType,
    note,
    flushFns: flushNow !== undefined ? new Set([flushNow]) : new Set(),
  })
}

/**
 * Registers a family of dynamically named persisted MMKV keys (e.g.
 * `hideForMessage-<messageId>`). Every key accepted by `parseKey` shares the
 * family's policy and native type. Atom instances created for keys of the
 * family register their flush fns under the family via {@link registerMmkvKey}.
 */
export function registerDynamicMmkvKeyFamily({
  prefix,
  parseKey,
  policy,
  nativeType,
  note,
}: {
  prefix: string
  parseKey: (key: string) => boolean
  policy: MigrationKeyPolicy
  nativeType: MmkvNativeType
  note?: string
}): void {
  const existing = dynamicKeyFamilies.get(prefix)
  if (existing !== undefined) {
    if (existing.policy !== policy || existing.nativeType !== nativeType) {
      throw new MmkvKeyOwnershipConflictError({
        key: prefix,
        message: `Dynamic MMKV key family '${prefix}' is already registered with policy '${existing.policy}' / native type '${existing.nativeType}' but was re-registered with policy '${policy}' / native type '${nativeType}'.`,
      })
    }
    return
  }

  dynamicKeyFamilies.set(prefix, {
    prefix,
    parseKey,
    policy,
    nativeType,
    note,
    instanceFlushFns: new Map(),
  })
}

/**
 * Resolves the migration policy and native type of one MMKV key. Static keys
 * take precedence over dynamic key families. Returns `undefined` for unknown
 * keys — there is deliberately no permissive default, an unknown key must
 * fail snapshot creation.
 */
export function resolveMmkvKeyPolicy(
  key: string
): ResolvedMmkvKeyPolicy | undefined {
  const staticEntry = staticKeys.get(key)
  if (staticEntry !== undefined)
    return {policy: staticEntry.policy, nativeType: staticEntry.nativeType}

  const family = findDynamicFamilyForKey(key)
  if (family !== undefined)
    return {policy: family.policy, nativeType: family.nativeType}

  return undefined
}

/**
 * Synchronously invokes every registered flush fn, persisting all writes
 * currently waiting behind the deferred idle-callback flush. Must be called
 * before enumerating MMKV for a migration snapshot — otherwise the snapshot
 * can be older than the current UI state (spec section "Deferred MMKV
 * writes").
 */
export function flushAllPendingMmkvWrites(): void {
  for (const entry of staticKeys.values()) {
    for (const flushFn of entry.flushFns) flushFn()
  }
  for (const family of dynamicKeyFamilies.values()) {
    for (const flushFn of family.instanceFlushFns.values()) flushFn()
  }
}

/**
 * Freezes MMKV persistence. While frozen, persisted atom setters keep
 * updating in-memory state but writes are never scheduled or performed —
 * they are silently dropped (no error reporting; migration requires
 * telemetry silence). Used from source quiescence through retirement and on
 * the destination until installation completes.
 */
export function freezeMmkvPersistence(): void {
  persistenceFrozen = true
}

/** Lifts the write freeze — e.g. after a safe pre-commit cancellation. */
export function unfreezeMmkvPersistence(): void {
  persistenceFrozen = false
}

export function isMmkvPersistenceFrozen(): boolean {
  return persistenceFrozen
}

/**
 * All statically registered keys, for the registry tripwire test comparing
 * registered keys against the expected inventory.
 */
export function getRegisteredStaticKeys(): readonly string[] {
  return [...staticKeys.keys()]
}

/**
 * All registered dynamic key family prefixes, for the registry tripwire
 * test.
 */
export function getRegisteredDynamicKeyFamilyPrefixes(): readonly string[] {
  return [...dynamicKeyFamilies.keys()]
}
