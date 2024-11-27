import {Either, Schema, pipe} from 'effect'
import {atom, type PrimitiveAtom} from 'jotai'
import {InteractionManager} from 'react-native'
import {storage} from '../mmkv/effectMmkv'
import reportError from '../reportError'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

const AUTHOR_ID_KEY = '___author_id'

export type AtomWithParsedMmkvStorage<
  Value extends Schema.Schema<any, any, never>,
> = PrimitiveAtom<Schema.Schema.Type<Value>>

function toShadowStorageAtom<Value extends Schema.Schema<any, any, never>>(
  key: string
): (
  baseAtom: PrimitiveAtom<Schema.Schema.Type<Value>>
) => PrimitiveAtom<Schema.Schema.Type<Value>> {
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
            Either.getOrElse((l) => {
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

function getInitialValue<Value extends Schema.Schema<any, any, never>>({
  key,
  schema,
  defaultValue,
}: {
  schema: Value
  key: string
  defaultValue: Schema.Schema.Type<Value>
}): Schema.Schema.Type<Value> {
  return pipe(
    storage.getVerified<Value>(key, schema),
    Either.getOrElse((l) => {
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
  Value extends Schema.Schema<any, any, never>,
>(
  key: string,
  defaultValue: Schema.Schema.Type<Value>,
  schema: Value,
  debugLabel?: string
): PrimitiveAtom<Schema.Schema.Type<Value>> {
  const coreAtom = atom(getInitialValue({key, schema, defaultValue}))
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
    setAtom(getInitialValue({key, schema, defaultValue}))
    const decodeValue = Schema.decodeUnknownEither(schema)

    const listener = storage._storage.addOnValueChangedListener(
      (changedKey) => {
        if (changedKey !== key) return

        void InteractionManager.runAfterInteractions(() => {
          pipe(
            storage.getJSON(key),
            Either.filterOrLeft(
              (value) => (value as any)[AUTHOR_ID_KEY] !== coreAtom.toString(),
              () =>
                ({
                  _tag: 'authoredByThisAtom',
                }) as const
            ),
            Either.map((value) => {
              const {[AUTHOR_ID_KEY]: _, ...rest} = value as any
              return rest
            }),
            Either.flatMap(decodeValue),
            Either.match({
              onLeft: (e) => {
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
              },
              onRight: setAtom,
            })
          )
        })
      }
    )

    return listener.remove
  }

  return mmkvAtom
}
