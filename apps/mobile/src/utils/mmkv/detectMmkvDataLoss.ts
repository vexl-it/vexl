import AsyncStorage from '@react-native-async-storage/async-storage'
import {File, Paths} from 'expo-file-system'
import {AppState} from 'react-native'
import reportError from '../reportError'
import {storage} from './effectMmkv'

// TODO: Temporary diagnostic to detect silent MMKV data wipes (OnErrorDiscard).
// Remove once the root cause of user data loss is identified.
//
// Kept out of effectMmkv.ts on purpose: effectMmkv is a low-level storage util
// and must not import reportError (which pulls in session state and would
// create a require cycle back to effectMmkv).
const MMKV_SENTINEL_KEY = '__mmkv_data_exists'
export const ASYNC_SENTINEL_KEY = '__mmkv_was_populated'

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

export function detectMmkvDataLoss(): void {
  const mmkvInstance = storage._storage
  try {
    const mmkvSentinel = mmkvInstance.getString(MMKV_SENTINEL_KEY)

    void AsyncStorage.getItem(ASYNC_SENTINEL_KEY)
      .then((asyncSentinel) => {
        try {
          if (!mmkvSentinel && asyncSentinel) {
            const remainingKeyCount = mmkvInstance.getAllKeys().length
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
        return AsyncStorage.setItem(ASYNC_SENTINEL_KEY, Date.now().toString())
      })
      .catch(() => {})
  } catch {}
}
