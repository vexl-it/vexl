import {Array, Either, pipe} from 'effect'
import {CLEAR_STORAGE_KEY} from './atomUtils/atomWithParsedMmkvStorage'
import {storage} from './mmkv/effectMmkv'

export default function clearMmkvStorageAndEmptyAtoms({
  preserveKeys = [],
}: {
  preserveKeys?: string[]
} = {}): void {
  const preservedValues = pipe(
    preserveKeys,
    Array.flatMap((key) =>
      pipe(
        storage.get(key),
        Either.match({
          onLeft: () => [],
          onRight: (value) => [{key, value}],
        })
      )
    )
  )

  storage._storage.clearAll()

  Array.map(preservedValues, ({key, value}) => {
    storage._storage.set(key, value)
  })

  // set all atoms except preserved ones to defaultValue
  storage.setJSON(CLEAR_STORAGE_KEY)({
    preserveKeys,
    clearedAt: Date.now(),
  })
}
