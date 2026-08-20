import AsyncStorage from '@react-native-async-storage/async-storage'
import {Array, Either, Schema, pipe} from 'effect'
import {File, Paths} from 'expo-file-system'
import {AppState} from 'react-native'
import reportError from '../reportError'
import {
  CRITICAL_KEYS_PRESENCE_RECORD_KEY,
  CriticalKeysPresenceRecordSchema,
  getPresentCriticalMmkvKeys,
  type CriticalMmkvKey,
} from './criticalMmkvKeys'
import {storage} from './effectMmkv'
import {
  ASYNC_SENTINEL_KEY,
  runMmkvDataLossDiagnosticOperation,
} from './mmkvDataLossDiagnosticStorage'

// TODO: Temporary diagnostic to detect silent MMKV data wipes (OnErrorDiscard).
// Remove once the root cause of user data loss is identified.
//
// Kept out of effectMmkv.ts on purpose: effectMmkv is a low-level storage util
// and must not import reportError (which pulls in session state and would
// create a require cycle back to effectMmkv).
const MMKV_SENTINEL_KEY = '__mmkv_data_exists'

const decodeCriticalKeysPresenceRecord = Schema.decodeUnknownEither(
  Schema.parseJson(CriticalKeysPresenceRecordSchema)
)

function getMmkvFilesDiagnostics(): Record<string, unknown> {
  const docDir = Paths.document
  if (!docDir) return {error: 'no document directory'}

  const dataFile = new File(docDir, 'mmkv/mmkv.default')
  const crcFile = new File(docDir, 'mmkv/mmkv.default.crc')

  return {
    dataFileExists: dataFile.exists,
    dataFileSize: dataFile.exists ? dataFile.size : null,
    crcFileExists: crcFile.exists,
    crcFileSize: crcFile.exists ? crcFile.size : null,
  }
}

function detectDisappearedCriticalKeys({
  previousPresentKeys,
  currentPresentKeys,
}: {
  previousPresentKeys: readonly CriticalMmkvKey[]
  currentPresentKeys: readonly CriticalMmkvKey[]
}): CriticalMmkvKey[] {
  return pipe(
    previousPresentKeys,
    Array.filter((key) => !Array.contains(currentPresentKeys, key))
  )
}

async function updateCriticalKeysPresenceRecord(
  presentKeys: readonly CriticalMmkvKey[]
): Promise<void> {
  await AsyncStorage.setItem(
    CRITICAL_KEYS_PRESENCE_RECORD_KEY,
    JSON.stringify({presentKeys})
  )
}

async function detectPartialMmkvDataLoss(
  mmkvInstance: (typeof storage)['_storage'],
  {
    skipReport,
    isCurrentGeneration,
  }: {skipReport: boolean; isCurrentGeneration: () => boolean}
): Promise<void> {
  const currentPresentKeys = getPresentCriticalMmkvKeys(mmkvInstance)
  const previousRecordRaw = await AsyncStorage.getItem(
    CRITICAL_KEYS_PRESENCE_RECORD_KEY
  )
  if (!isCurrentGeneration()) return

  if (previousRecordRaw !== null) {
    const disappearedKeys = pipe(
      decodeCriticalKeysPresenceRecord(previousRecordRaw),
      Either.match({
        onLeft: (): CriticalMmkvKey[] => [],
        onRight: (previousRecord) =>
          detectDisappearedCriticalKeys({
            previousPresentKeys: previousRecord.presentKeys,
            currentPresentKeys,
          }),
      })
    )

    if (Array.isNonEmptyArray(disappearedKeys) && !skipReport) {
      try {
        reportError(
          'error',
          new Error(
            'MMKV partial data loss detected: critical keys disappeared since last launch'
          ),
          {
            disappearedKeys,
            remainingKeyCount: mmkvInstance.getAllKeys().length,
            appState: AppState.currentState,
            ...getMmkvFilesDiagnostics(),
          }
        )
      } catch {
        // Leave the record unstamped so this signal is re-detected next launch.
        return
      }
    }
  }

  await updateCriticalKeysPresenceRecord(currentPresentKeys)
}

export function detectMmkvDataLoss(): void {
  const mmkvInstance = storage._storage
  try {
    const mmkvSentinel = mmkvInstance.getString(MMKV_SENTINEL_KEY)

    void runMmkvDataLossDiagnosticOperation(async (isCurrentGeneration) => {
      const asyncSentinel = await AsyncStorage.getItem(ASYNC_SENTINEL_KEY)
      if (!isCurrentGeneration()) return

      const remainingKeyCount = mmkvInstance.getAllKeys().length
      let totalWipeReported = false

      try {
        if (!mmkvSentinel && asyncSentinel && remainingKeyCount === 0) {
          totalWipeReported = true
          const fileDiagnostics = getMmkvFilesDiagnostics()

          reportError(
            'error',
            new Error(
              'MMKV data loss detected: data was previously stored but MMKV is now empty'
            ),
            {
              lastPopulatedAt: asyncSentinel,
              remainingKeyCount,
              appState: AppState.currentState,
              ...fileDiagnostics,
            }
          )
        }
      } catch {
        // Detection fired but gathering diagnostics or reporting threw.
        // Leave the sentinels unstamped so this one-shot data-loss signal
        // is re-detected and re-reported on the next launch instead of
        // being silently consumed.
        return
      }

      mmkvInstance.set(MMKV_SENTINEL_KEY, Date.now().toString())
      await AsyncStorage.setItem(ASYNC_SENTINEL_KEY, Date.now().toString())
      if (!isCurrentGeneration()) return

      try {
        await detectPartialMmkvDataLoss(mmkvInstance, {
          skipReport: totalWipeReported,
          isCurrentGeneration,
        })
      } catch {}
    }).catch(() => {})
  } catch {}
}
