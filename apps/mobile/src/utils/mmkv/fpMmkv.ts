import {Either, pipe} from 'effect'
import {MMKV} from 'react-native-mmkv'
import {type z} from 'zod'
import {
  JsonParseError,
  safeParse,
  stringifyToJson,
  type JsonStringifyError,
  type ZodParseError,
} from '../fpUtils'
import {ReadingFromStoreError, ValueNotSet, WritingToStoreError} from './domain'
export interface FpMMKV {
  _storage: MMKV
  set: (
    key: string
  ) => (value: string) => Either.Either<true, WritingToStoreError>
  get: (
    key: string
  ) => Either.Either<string, ReadingFromStoreError | ValueNotSet>

  setJSON: (
    key: string
  ) => (
    value: unknown
  ) => Either.Either<true, JsonStringifyError | WritingToStoreError>
  getJSON: (
    key: string
  ) => Either.Either<any, JsonParseError | ValueNotSet | ReadingFromStoreError>
  getVerified: <T extends z.ZodType>(
    key: string,
    zodType: z.TypeOf<T>
  ) => Either.Either<
    z.TypeOf<T>,
    | WritingToStoreError
    | JsonParseError
    | ValueNotSet
    | ReadingFromStoreError
    | ZodParseError<z.TypeOf<T>>
  >
}

function createFpMMKV(storage: MMKV): FpMMKV {
  function set(key: string): ReturnType<FpMMKV['set']> {
    return (value) =>
      Either.try({
        try: () => {
          storage.set(key, value)
          return true as const
        },
        catch: (e) => new WritingToStoreError({cause: e}),
      })
  }

  function get(key: string): ReturnType<FpMMKV['get']> {
    return pipe(
      Either.try({
        try: () => storage.getString(key),
        catch: (e) => new ReadingFromStoreError({cause: e}),
      }),
      Either.filterOrLeft(
        (x): x is NonNullable<typeof x> => x !== null && x !== undefined,
        () => new ValueNotSet()
      )
    )
  }

  function setJSON(key: string): ReturnType<FpMMKV['setJSON']> {
    return (value) => pipe(stringifyToJson(value), Either.flatMap(set(key)))
  }

  function getJSON(key: string): ReturnType<FpMMKV['getJSON']> {
    return pipe(
      get(key),
      Either.flatMap((json) =>
        Either.try({
          try: () => JSON.parse(json),
          catch: (e) => new JsonParseError({cause: e}),
        })
      )
    )
  }

  const getVerified = <T extends z.ZodType>(
    key: string,
    zodType: z.TypeOf<T>
  ): Either.Either<
    z.TypeOf<T>,
    | WritingToStoreError
    | ValueNotSet
    | JsonParseError
    | ZodParseError<z.TypeOf<T>>
    | ReadingFromStoreError
  > => pipe(getJSON(key), Either.flatMap(safeParse(zodType)))

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
