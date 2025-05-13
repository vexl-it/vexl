import {Either, Schema, pipe, type ParseResult} from 'effect'
import {atom, type PrimitiveAtom} from 'jotai'
import {InteractionManager} from 'react-native'
import {type WritingToStoreError} from '../mmkv/domain'
import {storage} from '../mmkv/effectMmkv'
import reportError from '../reportError'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

const AUTHOR_ID_KEY = '___author_id' as const
export const CLEAR_STORAGE_KEY = '__clear_storage'

const AuthorKeySchema = Schema.Struct({
  [AUTHOR_ID_KEY]: Schema.String,
})

const saveWithAuthorKey = <A, I extends object>({
  schema,
  authorKey,
  value,
  key,
}: {
  schema: Schema.Schema<A, I, never>
  authorKey: string
  value: A
  key: string
}): Either.Either<void, WritingToStoreError | ParseResult.ParseError> => {
  const schemaWithAuthorKey = Schema.extend(AuthorKeySchema)(schema)

  const valueToSave: typeof schemaWithAuthorKey.Type = {
    ...value,
    [AUTHOR_ID_KEY]: authorKey,
  }

  return storage.saveVerified(key, schemaWithAuthorKey)(valueToSave)
}

function toShadowStorageAtom<A, I extends object>(
  key: string,
  schema: Schema.Schema<A, I, never>
): (baseAtom: PrimitiveAtom<A>) => PrimitiveAtom<A> {
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
            saveWithAuthorKey({
              schema,
              authorKey: baseAtom.toString(),
              value: newValue,
              key,
            }),
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

function getInitialValue<A, I extends object>({
  key,
  schema,
  defaultValue,
}: {
  schema: Schema.Schema<A, I, never>
  key: string
  defaultValue: A
}): A {
  return pipe(
    storage.getVerified(key, schema),
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

export function atomWithParsedMmkvStorageE<A, I extends object>(
  key: string,
  defaultValue: A,
  schema: Schema.Schema<A, I, never>,
  debugLabel?: string
): PrimitiveAtom<A> {
  const coreAtom = atom(getInitialValue({key, schema, defaultValue}))
  const mmkvAtom = pipe(coreAtom, toShadowStorageAtom(key, schema))

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
        if (changedKey === CLEAR_STORAGE_KEY) {
          console.info(`Setting MMKV atom with key '${key}' to default value`)
          setAtom(defaultValue)
          return
        }

        if (changedKey !== key) return

        void InteractionManager.runAfterInteractions(() => {
          pipe(
            storage.getVerified(key, AuthorKeySchema),
            Either.filterOrLeft(
              (value) => value[AUTHOR_ID_KEY] !== coreAtom.toString(),
              () =>
                ({
                  _tag: 'authoredByThisAtom',
                }) as const
            ),
            Either.flatMap(() => storage.getVerified(key, schema)),
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
