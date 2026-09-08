import {plaintextStorage} from '../../../utils/mmkv/effectMmkv'

export const V2_SECRET_WAS_WRITTEN_STORAGE_KEY = 'session:v2SecretWasWritten'

export function markV2SecretAsWritten(): void {
  try {
    plaintextStorage._storage.set(V2_SECRET_WAS_WRITTEN_STORAGE_KEY, true)
  } catch {
    // This marker is diagnostic only and must not block session persistence.
  }
}

export function clearV2SecretWasWrittenFlag(): void {
  try {
    plaintextStorage._storage.remove(V2_SECRET_WAS_WRITTEN_STORAGE_KEY)
  } catch {
    // This marker is diagnostic only and must not block logout cleanup.
  }
}

export function wasV2SecretWritten(): boolean {
  try {
    return (
      plaintextStorage._storage.getBoolean(V2_SECRET_WAS_WRITTEN_STORAGE_KEY) ??
      false
    )
  } catch {
    return false
  }
}
