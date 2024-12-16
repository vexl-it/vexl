import {Either, Schema, pipe, type ParseResult} from 'effect'
import {atom, type PrimitiveAtom} from 'jotai'
import {InteractionManager} from 'react-native'
import {type WritingToStoreError} from '../mmkv/domain'
import {storage} from '../mmkv/effectMmkv'
import reportError from '../reportError'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

const AUTHOR_ID_KEY = '___author_id' as const

const AuthorKeySchema: Schema.Schema.AnyNoContext = Schema.Struct({
  [AUTHOR_ID_KEY]: Schema.String,
})

const saveWithAuthorKey = <S extends Schema.Schema<any, object, never>>({
  schema,
  authorKey,
  value,
  key,
}: {
  schema: S & Schema.Schema.AnyNoContext
  authorKey: string
  value: Schema.Schema.Type<S>
  key: string
}): Either.Either<void, WritingToStoreError | ParseResult.ParseError> => {
  const schemaNoContext: Schema.Schema.AnyNoContext = schema

  const schemaWithAuthorKey: Schema.Schema.AnyNoContext = Schema.extend(
    AuthorKeySchema satisfies Schema.Schema.AnyNoContext
  )(schemaNoContext)

  const valueToSave: typeof schemaWithAuthorKey.Type = {
    ...value,
    [AUTHOR_ID_KEY]: authorKey,
  }

  return storage.saveVerified(key, schemaWithAuthorKey)(valueToSave)
}

function toShadowStorageAtom<S extends Schema.Schema.AnyNoContext>(
  key: string,
  schema: S
): (
  baseAtom: PrimitiveAtom<Schema.Schema.Type<S>>
) => PrimitiveAtom<Schema.Schema.Type<S>> {
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

function getInitialValue<S extends Schema.Schema<any, object, never>>({
  key,
  schema,
  defaultValue,
}: {
  schema: S
  key: string
  defaultValue: Schema.Schema.Type<S>
}): Schema.Schema.Type<S> {
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

export function atomWithParsedMmkvStorageE<S extends Schema.Struct.Fields>(
  key: string,
  defaultValue: Schema.Schema.Type<Schema.Struct<S>>,
  struct: Schema.Struct<S> & Schema.Schema.AnyNoContext,
  debugLabel?: string
): PrimitiveAtom<Schema.Schema.Type<Schema.Struct<S>>> {
  const schema = Schema.asSchema(struct)
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
