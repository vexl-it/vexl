import {Either, flow, Schema, type ParseResult} from 'effect'
import {MMKV} from 'react-native-mmkv'
import {JsonParseError, JsonStringifyError} from '../fpUtils'
import {ReadingFromStoreError, ValueNotSet, WritingToStoreError} from './domain'

export interface EffectMmkv {
  _storage: MMKV
  set: (
    key: string
  ) => (value: string) => Either.Either<void, WritingToStoreError>
  get: (
    key: string
  ) => Either.Either<string, ReadingFromStoreError | ValueNotSet>

  setJSON: (
    key: string
  ) => (
    value: unknown
  ) => Either.Either<void, JsonStringifyError | WritingToStoreError>
  getJSON: (
    key: string
  ) => Either.Either<
    unknown,
    JsonParseError | ValueNotSet | ReadingFromStoreError
  >
  getVerified: <A, I>(
    key: string,
    schema: Schema.Schema<A, I, never>
  ) => Either.Either<
    A,
    | WritingToStoreError
    | JsonParseError
    | ValueNotSet
    | ReadingFromStoreError
    | ParseResult.ParseError
  >

  saveVerified: <A, I>(
    key: string,
    schema: Schema.Schema<A, I, never>
  ) => (
    value: A
  ) => Either.Either<void, WritingToStoreError | ParseResult.ParseError>
}

function createEffectMmkv(storage: MMKV): EffectMmkv {
  function set(key: string): ReturnType<EffectMmkv['set']> {
    return (value) =>
      Either.try({
        try: () => {
          storage.set(key, value)
        },
        catch: (e) => new WritingToStoreError({cause: e}),
      })
  }

  function get(key: string): ReturnType<EffectMmkv['get']> {
    return Either.try({
      try: () => storage.getString(key),
      catch: (e) => new ReadingFromStoreError({cause: e}),
    }).pipe(
      Either.filterOrLeft(
        (x) => x !== null && x !== undefined,
        () => new ValueNotSet()
      )
    )
  }

  const toJson = flow(
    Schema.encodeEither(Schema.parseJson(Schema.Unknown)),
    Either.mapLeft((cause) => new JsonStringifyError({cause}))
  )
  function setJSON(key: string): ReturnType<EffectMmkv['setJSON']> {
    return (value) => toJson(value).pipe(Either.flatMap(set(key)))
  }

  const fromJson = flow(
    Schema.decodeEither(Schema.parseJson(Schema.Unknown)),
    Either.mapLeft((cause) => new JsonParseError({cause}))
  )
  function getJSON(key: string): ReturnType<EffectMmkv['getJSON']> {
    return get(key).pipe(Either.flatMap(fromJson))
  }

  const getVerified = <A>(
    key: string,
    schema: Schema.Schema<A, any, never>
  ): Either.Either<
    A,
    ValueNotSet | ReadingFromStoreError | ParseResult.ParseError
  > =>
    get(key).pipe(Either.flatMap(Schema.decodeEither(Schema.parseJson(schema))))

  const saveVerified =
    <A, I>(key: string, schema: Schema.Schema<A, I, never>) =>
    (
      value: A
    ): Either.Either<void, WritingToStoreError | ParseResult.ParseError> => {
      return Schema.encodeEither(Schema.parseJson(schema))(value).pipe(
        Either.flatMap(set(key))
      )
    }

  return {
    _storage: storage,
    set,
    get,
    setJSON,
    getJSON,
    getVerified,
    saveVerified,
  }
}

const mmkv = new MMKV()
if (__DEV__) {
  // @ts-expect-error for debugging purposes
  window.__mmkv = mmkv
}
export const storage = createEffectMmkv(mmkv)
