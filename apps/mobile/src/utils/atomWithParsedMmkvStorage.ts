import {MMKV} from 'react-native-mmkv'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {type z} from 'zod'
import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import reportError from './reportError'
import {createFpMMKV} from './fsMmkv'

const storage = createFpMMKV(new MMKV())

export type AtomWithParsedMmkvStorage<Value extends z.ZodType> = WritableAtom<
  z.TypeOf<Value>,
  [update: z.TypeOf<Value> | ((prev: z.TypeOf<Value>) => z.TypeOf<Value>)],
  z.TypeOf<Value>
>

function toShadowStorageAtom<Value extends z.ZodType>(
  key: string
): (
  baseAtom: WritableAtom<
    z.TypeOf<Value>,
    [update: z.TypeOf<Value>],
    z.TypeOf<Value>
  >
) => AtomWithParsedMmkvStorage<Value> {
  return (baseAtom) =>
    atom<
      z.TypeOf<Value>,
      [update: z.TypeOf<Value> | ((prev: z.TypeOf<Value>) => z.TypeOf<Value>)],
      z.TypeOf<Value>
    >(
      (get) => get(baseAtom),
      (get, set, update) => {
        const newValue =
          typeof update === 'function'
            ? (update as (prev: z.TypeOf<Value>) => z.TypeOf<Value>)(
                get(baseAtom)
              )
            : update

        pipe(
          newValue,
          storage.setJSON(key),
          E.match(
            (l) => {
              reportError(
                'warn',
                `Error while saving value to storage. Key: ${key}`,
                l
              )
            },
            (r) => {
              set(baseAtom, newValue)
            }
          )
        )
      }
    )
}

export function atomWithParsedMmkvStorage<Value extends z.ZodType>(
  key: string,
  defaultValue: SetStateAction<z.TypeOf<Value>>,
  zodType: Value
): AtomWithParsedMmkvStorage<Value> {
  return pipe(
    storage.getVerified(key, zodType),
    E.getOrElse((l) => {
      if (l._tag !== 'ValueNotSet') {
        reportError(
          'warn',
          `Error while parsing stored value. Using provided default. Key: ${key}`,
          l
        )
      }
      return defaultValue
    }),
    atom,
    toShadowStorageAtom(key)
  )
}
