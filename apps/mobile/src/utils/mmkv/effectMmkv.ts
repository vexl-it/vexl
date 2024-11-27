import {Either, flow, Schema, type ParseResult} from 'effect'
import {MMKV} from 'react-native-mmkv'
import {JsonParseError, JsonStringifyError} from '../fpUtils'
import {ReadingFromStoreError, ValueNotSet, WritingToStoreError} from './domain'

export interface FpMMKV {
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
  getVerified: <T extends Schema.Schema<any, any, never>>(
    key: string,
    schema: T
  ) => Either.Either<
    Schema.Schema.Type<T>,
    | WritingToStoreError
    | JsonParseError
    | ValueNotSet
    | ReadingFromStoreError
    | ParseResult.ParseError
  >
}

function createFpMMKV(storage: MMKV): FpMMKV {
  function set(key: string): ReturnType<FpMMKV['set']> {
    return (value) =>
      Either.try({
        try: () => {
          storage.set(key, value)
        },
        catch: (e) => new WritingToStoreError({cause: e}),
      })
  }

  function get(key: string): ReturnType<FpMMKV['get']> {
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
  function setJSON(key: string): ReturnType<FpMMKV['setJSON']> {
    return (value) => toJson(value).pipe(Either.flatMap(set(key)))
  }

  const fromJson = flow(
    Schema.decodeEither(Schema.parseJson(Schema.Unknown)),
    Either.mapLeft((cause) => new JsonParseError({cause}))
  )
  function getJSON(key: string): ReturnType<FpMMKV['getJSON']> {
    return get(key).pipe(Either.flatMap(fromJson))
  }

  const getVerified = <T extends Schema.Schema<any, any, never>>(
    key: string,
    schema: T
  ): Either.Either<
    Schema.Schema.Type<T>,
    | WritingToStoreError
    | JsonParseError
    | ValueNotSet
    | ReadingFromStoreError
    | ParseResult.ParseError
  > => getJSON(key).pipe(Either.flatMap(Schema.decodeUnknownEither(schema)))

  return {
    _storage: storage,
    set,
    get,
    setJSON,
    getJSON,
    getVerified,
  }
}

export const storage = createFpMMKV(new MMKV())
