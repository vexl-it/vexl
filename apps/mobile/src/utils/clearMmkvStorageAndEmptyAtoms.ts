import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  CLEAR_STORAGE_KEY,
  invalidateScheduledMmkvWrites,
} from './atomUtils/atomWithParsedMmkvStorage'
// TODO: ASYNC_SENTINEL_KEY import is part of temporary MMKV data loss diagnostic. Remove together with the sentinel.
import {ASYNC_SENTINEL_KEY} from './mmkv/detectMmkvDataLoss'
import {storage} from './mmkv/effectMmkv'

export default function clearMmkvStorageAndEmptyAtoms(): void {
  // set all atoms to defaultValue
  storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())

  // Invalidate any writes already scheduled behind the deferred flush so a
  // pending write cannot resurrect just-cleared data after clearAll() runs.
  invalidateScheduledMmkvWrites()

  void AsyncStorage.removeItem(ASYNC_SENTINEL_KEY).catch(() => {})
  storage._storage.clearAll()
}
