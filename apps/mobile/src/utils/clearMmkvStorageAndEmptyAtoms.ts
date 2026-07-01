import AsyncStorage from '@react-native-async-storage/async-storage'
import {CLEAR_STORAGE_KEY} from './atomUtils/atomWithParsedMmkvStorage'
// TODO: ASYNC_SENTINEL_KEY import is part of temporary MMKV data loss diagnostic. Remove together with the sentinel.
import {ASYNC_SENTINEL_KEY, storage} from './mmkv/effectMmkv'

export default function clearMmkvStorageAndEmptyAtoms(): void {
  // set all atoms to defaultValue
  storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())

  void AsyncStorage.removeItem(ASYNC_SENTINEL_KEY).catch(() => {})
  storage._storage.clearAll()
}
