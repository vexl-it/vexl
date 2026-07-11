import {registerMmkvKey} from '../../../utils/atomUtils/mmkvMigrationRegistry'
import {storage} from '../../../utils/mmkv/effectMmkv'

export const V2_SECRET_WAS_WRITTEN_STORAGE_KEY = 'session:v2SecretWasWritten'

// Diagnostic marker that the destination-local session secret was written on
// THIS device — never migrated (the installer writes its own after creating a
// fresh destination session secret).
registerMmkvKey({
  key: V2_SECRET_WAS_WRITTEN_STORAGE_KEY,
  policy: 'deviceLocal',
  nativeType: 'boolean',
})

export function markV2SecretAsWritten(): void {
  try {
    storage._storage.set(V2_SECRET_WAS_WRITTEN_STORAGE_KEY, true)
  } catch {
    // This marker is diagnostic only and must not block session persistence.
  }
}

export function clearV2SecretWasWrittenFlag(): void {
  try {
    storage._storage.delete(V2_SECRET_WAS_WRITTEN_STORAGE_KEY)
  } catch {
    // This marker is diagnostic only and must not block logout cleanup.
  }
}

export function wasV2SecretWritten(): boolean {
  try {
    return (
      storage._storage.getBoolean(V2_SECRET_WAS_WRITTEN_STORAGE_KEY) ?? false
    )
  } catch {
    return false
  }
}
