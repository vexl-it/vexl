import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {type z} from 'zod'
import {pipe} from 'fp-ts/function'
import {
  fsParseJson,
  fsSafeParseE,
  fsStringifyJson,
  getItemFromAsyncStorage,
  saveItemToAsyncStorage,
} from './fsUtils'
import reportError from './reportError'

export function atomWithParsedAsyncStorage<Value extends z.ZodType>(
  key: string,
  defaultValue: SetStateAction<z.TypeOf<Value>>,
  zodType: Value
): WritableAtom<
  O.Option<z.TypeOf<Value>>,
  [
    update:
      | z.TypeOf<Value>
      | ((prev: O.Option<z.TypeOf<Value>>) => z.TypeOf<Value>)
  ],
  z.TypeOf<Value>
> {
  const baseAtom = atom<O.Option<z.TypeOf<Value>>>(O.none)
  baseAtom.onMount = (setAtom) => {
    void pipe(
      getItemFromAsyncStorage(key),
      TE.chainEitherKW(fsParseJson),
      TE.chainEitherKW(fsSafeParseE(zodType)),
      TE.match(
        (l) => {
          if (l._tag === 'storeEmpty') {
            setAtom(O.some(defaultValue))
            return
          }
          reportError(
            'warn',
            `Error getting item from async storage with key ${key}`,
            l
          )
        },
        (value) => {
          setAtom(O.some(value))
        }
      )
    )()
  }

  return atom<
    O.Option<z.TypeOf<Value>>,
    [
      update:
        | z.TypeOf<Value>
        | ((prev: O.Option<z.TypeOf<Value>>) => z.TypeOf<Value>)
    ],
    z.TypeOf<Value>
  >(
    (get) => get(baseAtom),
    (get, set, update) => {
      const newValue =
        typeof update === 'function'
          ? (update as (prev: O.Option<z.TypeOf<Value>>) => z.TypeOf<Value>)(
              get(baseAtom)
            )
          : update

      void pipe(
        fsStringifyJson(newValue),
        TE.fromEither,
        TE.chainW(saveItemToAsyncStorage(key)),
        TE.match(
          (l) => {
            reportError(
              'warn',
              `Error saving item to async storage with key ${key}`,
              l
            )
          },
          () => {
            console.info('Saved item to async storage with key', key)
          }
        )
      )()
      set(baseAtom, O.some(update))
    }
  )
}
