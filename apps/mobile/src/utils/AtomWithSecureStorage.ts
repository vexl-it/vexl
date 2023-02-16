import {Atom, atom} from 'jotai'
import * as SecureStore from 'expo-secure-store'
import * as O from 'fp-ts/Option'
import type z from 'zod'

export default function atomWithSecureStorageInJson<T extends z.ZodType>(
  key: string,
  initialValue: O.Option<z.TypeOf<T>>,
  validation: T
) {
  const baseAtom = atom(initialValue)
  baseAtom.onMount = (setValue) => {
    void (async () => {
      const itemRawJson = await SecureStore.getItemAsync(key)
      if (itemRawJson === null) {
        setValue(O.none)
        return
      }
      const itemParsed = JSON.parse(itemRawJson)
    })()
  }
}
