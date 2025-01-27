import {CLEAR_STORAGE_KEY} from './atomUtils/atomWithParsedMmkvStorageE'
import {storage} from './mmkv/fpMmkv'

export default function clearMmkvStorageAndEmptyAtoms(): void {
  // set all atoms to defaultValue
  storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())

  storage._storage.clearAll()
}
