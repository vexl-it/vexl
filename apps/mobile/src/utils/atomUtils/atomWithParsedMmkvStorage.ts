import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {atom, type PrimitiveAtom} from 'jotai'
import {InteractionManager} from 'react-native'
import {type z} from 'zod'
import {safeParse} from '../fpUtils'
import {storage} from '../mmkv/fpMmkv'
import reportError from '../reportError'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

const AUTHOR_ID_KEY = '___author_id'
const CLEAR_STORAGE_KEY = '__clear_storage'

export type AtomWithParsedMmkvStorage<Value extends z.ZodObject<any>> =
  PrimitiveAtom<z.TypeOf<Value>>

function toShadowStorageAtom<Value extends z.ZodObject<any>>(
  key: string
): (
  baseAtom: PrimitiveAtom<z.TypeOf<Value>>
) => PrimitiveAtom<z.TypeOf<Value>> {
  return (baseAtom) =>
    atom(
      (get) => get(baseAtom),
      (get, set, update): void => {
        const newValue = getValueFromSetStateActionOfAtom(update)(() =>
          get(baseAtom)
        )
        set(baseAtom, newValue)

        void InteractionManager.runAfterInteractions(() => {
          pipe(
            {...newValue, [AUTHOR_ID_KEY]: baseAtom.toString()},
            storage.setJSON(key),
            E.getOrElseW((l) => {
              reportError(
                'warn',
                new Error(`Error while saving value to storage. Key: ${key}`),
                {l}
              )
            })
          )
        })
      }
    )
}

function getInitialValue<Value extends z.ZodReadonly<z.ZodObject<any>>>({
  key,
  zodType,
  defaultValue,
}: {
  zodType: Value
  key: string
  defaultValue: z.TypeOf<Value>
}): z.TypeOf<Value> {
  return pipe(
    storage.getVerified<Value>(key, zodType),
    E.getOrElse((l) => {
      if (l._tag !== 'ValueNotSet') {
        reportError(
          'warn',
          new Error(
            `Error while parsing stored value. Using provided default. Key: ${key}`
          ),
          {l}
        )
      }
      return defaultValue
    })
  )
}

export function atomWithParsedMmkvStorage<
  Value extends z.ZodReadonly<z.ZodObject<any>>,
>(
  key: string,
  defaultValue: z.TypeOf<Value>,
  zodType: Value,
  debugLabel?: string
): PrimitiveAtom<z.TypeOf<Value>> {
  const coreAtom = atom(getInitialValue({key, zodType, defaultValue}))
  const mmkvAtom = pipe(coreAtom, toShadowStorageAtom(key))

  mmkvAtom.debugLabel = `${
    debugLabel ?? ''
  }MMKV shadow atom for key ${key} ${mmkvAtom.toString()}`
  coreAtom.debugLabel = `${
    debugLabel ?? ''
  }MMKV core atom for key ${key} ${coreAtom.toString()}`

  coreAtom.onMount = (setAtom) => {
    // Important to get the value from storage again.
    // If the value has changed from when the atom was created,
    // atom won't be updated, because it was not mounted yet and thus
    // not listening for changes
    setAtom(getInitialValue({key, zodType, defaultValue}))

    const listener = storage._storage.addOnValueChangedListener(
      (changedKey) => {
        if (changedKey === CLEAR_STORAGE_KEY) {
          console.info(`Setting MMKV atom with key '${key}' to default value`)
          setAtom(defaultValue)
          return
        }

        if (changedKey !== key) return

        void InteractionManager.runAfterInteractions(() => {
          pipe(
            storage.getJSON(key),
            E.filterOrElseW(
              (value) => value[AUTHOR_ID_KEY] !== coreAtom.toString(),
              () =>
                ({
                  _tag: 'authoredByThisAtom',
                }) as const
            ),
            E.map(({[AUTHOR_ID_KEY]: _, ...rest}) => rest),
            E.chainW(safeParse(zodType)),
            E.match((e) => {
              if (e._tag === 'authoredByThisAtom') {
                return
              }
              if (e._tag === 'ValueNotSet') {
                console.info(
                  `MMKV value for key '${key}' was deleted. Setting atom to default value`
                )
                setAtom(defaultValue)
                return
              }
              reportError(
                'warn',
                new Error(
                  `Error while parsing stored mmkv value in onChange function. Key: '${key}'`
                ),
                {e}
              )
            }, setAtom)
          )
        })
      }
    )

    return listener.remove
  }

  return mmkvAtom
}
