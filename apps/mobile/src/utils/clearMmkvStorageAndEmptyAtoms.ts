import {
  beginMmkvStorageClear,
  CLEAR_STORAGE_KEY,
} from './atomUtils/atomWithParsedMmkvStorage'
import {plaintextStorage, storage} from './mmkv/effectMmkv'
import {clearMmkvDataLossDiagnostics} from './mmkv/mmkvDataLossDiagnosticStorage'
import {deleteUserMmkvStorage} from './mmkv/userMmkvStorage'

export default async function clearMmkvStorageAndEmptyAtoms(): Promise<void> {
  // set all atoms to defaultValue
  const clearedAt = Date.now().toString()
  storage._storage.set(CLEAR_STORAGE_KEY, clearedAt)
  plaintextStorage._storage.set(CLEAR_STORAGE_KEY, clearedAt)

  const finishStorageClear = beginMmkvStorageClear()

  try {
    await clearMmkvDataLossDiagnostics(() => {
      plaintextStorage._storage.clearAll()
      deleteUserMmkvStorage()
    })
  } finally {
    finishStorageClear()
  }
}
