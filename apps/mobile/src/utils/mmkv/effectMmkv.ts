import {flow, Result, Schema} from 'effect'
import {createMMKV, type MMKV} from 'react-native-mmkv'
import {JsonParseError, JsonStringifyError} from '../fpUtils'
import {ReadingFromStoreError, ValueNotSet, WritingToStoreError} from './domain'

export interface EffectMmkv {
  _storage: MMKV
  set: (
    key: string
  ) => (value: string) => Result.Result<void, WritingToStoreError>
  get: (
    key: string
  ) => Result.Result<string, ReadingFromStoreError | ValueNotSet>

  setJSON: (
    key: string
  ) => (
    value: unknown
  ) => Result.Result<void, JsonStringifyError | WritingToStoreError>
  getJSON: (
    key: string
  ) => Result.Result<
    unknown,
    JsonParseError | ValueNotSet | ReadingFromStoreError
  >
  getVerified: <A, I>(
    key: string,
    schema: Schema.Codec<A, I, never, never>
  ) => Result.Result<
    A,
    | WritingToStoreError
    | JsonParseError
    | ValueNotSet
    | ReadingFromStoreError
    | Schema.SchemaError
  >

  saveVerified: <A, I>(
    key: string,
    schema: Schema.Codec<A, I, never, never>
  ) => (
    value: A
  ) => Result.Result<void, WritingToStoreError | Schema.SchemaError>
}

function createEffectMmkv(storage: MMKV): EffectMmkv {
  function set(key: string): ReturnType<EffectMmkv['set']> {
    return (value) =>
      Result.try({
        try: () => {
          storage.set(key, value)
        },
        catch: (e) => new WritingToStoreError({cause: e}),
      })
  }

  function get(key: string): ReturnType<EffectMmkv['get']> {
    return Result.try({
      try: () => storage.getString(key),
      catch: (e) => new ReadingFromStoreError({cause: e}),
    }).pipe(
      Result.filterOrFail(
        (x) => x !== null && x !== undefined,
        () => new ValueNotSet()
      )
    )
  }

  const toJson = flow(
    Schema.encodeResult(Schema.fromJsonString(Schema.Unknown)),
    Result.mapError((cause) => new JsonStringifyError({cause}))
  )
  function setJSON(key: string): ReturnType<EffectMmkv['setJSON']> {
    return (value) => toJson(value).pipe(Result.flatMap(set(key)))
  }

  const fromJson = flow(
    Schema.decodeResult(Schema.fromJsonString(Schema.Unknown)),
    Result.mapError((cause) => new JsonParseError({cause}))
  )
  function getJSON(key: string): ReturnType<EffectMmkv['getJSON']> {
    return get(key).pipe(Result.flatMap(fromJson))
  }

  const getVerified = <A>(
    key: string,
    schema: Schema.Codec<A, any, never, never>
  ): Result.Result<
    A,
    ValueNotSet | ReadingFromStoreError | Schema.SchemaError
  > =>
    get(key).pipe(
      Result.flatMap(Schema.decodeResult(Schema.fromJsonString(schema)))
    )

  const saveVerified =
    <A, I>(key: string, schema: Schema.Codec<A, I, never, never>) =>
    (
      value: A
    ): Result.Result<void, WritingToStoreError | Schema.SchemaError> => {
      return Schema.encodeResult(Schema.fromJsonString(schema))(value).pipe(
        Result.flatMap(set(key))
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

const mmkv = createMMKV({
  id: 'mmkv.default',
  recoveryStrategy: 'recover-on-error',
  compareBeforeSet: true,
})
if (__DEV__) {
  // @ts-expect-error for debugging purposes
  window.__mmkv = mmkv
}
export const storage = createEffectMmkv(mmkv)
