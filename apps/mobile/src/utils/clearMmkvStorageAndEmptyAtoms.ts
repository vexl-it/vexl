import {
  beginMmkvStorageClear,
  CLEAR_STORAGE_KEY,
} from './atomUtils/atomWithParsedMmkvStorage'
import {storage} from './mmkv/effectMmkv'
import {clearMmkvDataLossDiagnostics} from './mmkv/mmkvDataLossDiagnosticStorage'

export default async function clearMmkvStorageAndEmptyAtoms(): Promise<void> {
  // set all atoms to defaultValue
  storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())

  const finishStorageClear = beginMmkvStorageClear()

  try {
    await clearMmkvDataLossDiagnostics(() => {
      storage._storage.clearAll()
    })
  } finally {
    finishStorageClear()
  }
}
