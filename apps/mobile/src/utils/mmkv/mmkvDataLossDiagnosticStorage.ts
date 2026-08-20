import AsyncStorage from '@react-native-async-storage/async-storage'
import {Array, Either, Schema, pipe} from 'effect'
import {
  CRITICAL_KEYS_PRESENCE_RECORD_KEY,
  CriticalKeysPresenceRecordSchema,
  isCriticalMmkvKey,
} from './criticalMmkvKeys'

export const ASYNC_SENTINEL_KEY = '__mmkv_was_populated'

const decodeCriticalKeysPresenceRecord = Schema.decodeUnknownEither(
  Schema.parseJson(CriticalKeysPresenceRecordSchema)
)

let pendingDiagnosticOperation: Promise<void> = Promise.resolve()
let storageGeneration = 0

export function runMmkvDataLossDiagnosticOperation<A>(
  operation: (isCurrentGeneration: () => boolean) => Promise<A>
): Promise<A> {
  const operationGeneration = storageGeneration
  const isCurrentGeneration = (): boolean =>
    operationGeneration === storageGeneration
  const runOperation = (): Promise<A> => operation(isCurrentGeneration)
  const result = pendingDiagnosticOperation.then(runOperation, runOperation)
  pendingDiagnosticOperation = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

/**
 * Records only the name of a critical key after its value reached MMKV.
 * Calls are serialized with startup detection and intentional clears so a
 * stale startup snapshot cannot overwrite a key recorded during first use.
 */
export function recordCriticalMmkvKeyPersisted(key: string): Promise<void> {
  if (!isCriticalMmkvKey(key)) return Promise.resolve()
  const generationWhenPersisted = storageGeneration

  return runMmkvDataLossDiagnosticOperation(async () => {
    if (generationWhenPersisted !== storageGeneration) return

    const previousRecordRaw = await AsyncStorage.getItem(
      CRITICAL_KEYS_PRESENCE_RECORD_KEY
    )
    const previousPresentKeys =
      previousRecordRaw === null
        ? []
        : pipe(
            decodeCriticalKeysPresenceRecord(previousRecordRaw),
            Either.match({
              onLeft: () => [],
              onRight: (record) => record.presentKeys,
            })
          )

    if (pipe(previousPresentKeys, Array.contains(key))) return

    await AsyncStorage.setItem(
      CRITICAL_KEYS_PRESENCE_RECORD_KEY,
      JSON.stringify({
        presentKeys: pipe(previousPresentKeys, Array.append(key)),
      })
    )
  }).catch(() => {})
}

export function clearMmkvDataLossDiagnostics(
  clearMmkvStorage: () => void
): Promise<void> {
  storageGeneration += 1
  const clearingGeneration = storageGeneration

  try {
    clearMmkvStorage()
  } catch (error) {
    if (storageGeneration === clearingGeneration) storageGeneration += 1
    return Promise.reject(
      error instanceof Error
        ? error
        : new Error('Failed to clear MMKV storage', {cause: error})
    )
  }

  return runMmkvDataLossDiagnosticOperation(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ASYNC_SENTINEL_KEY).catch(() => {}),
        AsyncStorage.removeItem(CRITICAL_KEYS_PRESENCE_RECORD_KEY).catch(
          () => {}
        ),
      ])
    } finally {
      try {
        clearMmkvStorage()
      } finally {
        if (storageGeneration === clearingGeneration) storageGeneration += 1
      }
    }
  })
}
