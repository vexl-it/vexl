import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {MMKV} from 'react-native-mmkv'
import {type z} from 'zod'
import {
  parseJsonFp,
  safeParse,
  stringifyToJson,
  type JsonParseError,
  type JsonStringifyError,
  type ZodParseError,
} from '../fpUtils'
import {ReadingFromStoreError, ValueNotSet, WritingToStoreError} from './domain'
export interface FpMMKV {
  _storage: MMKV
  set: (key: string) => (value: string) => E.Either<WritingToStoreError, true>
  get: (key: string) => E.Either<ReadingFromStoreError | ValueNotSet, string>

  setJSON: (
    key: string
  ) => (
    value: unknown
  ) => E.Either<JsonStringifyError | WritingToStoreError, true>
  getJSON: (
    key: string
  ) => E.Either<JsonParseError | ValueNotSet | ReadingFromStoreError, any>
  getVerified: <T extends z.ZodType>(
    key: string,
    zodType: z.TypeOf<T>
  ) => E.Either<
    | WritingToStoreError
    | JsonParseError
    | ValueNotSet
    | ReadingFromStoreError
    | ZodParseError<z.TypeOf<T>>,
    z.TypeOf<T>
  >
}

function createFpMMKV(storage: MMKV): FpMMKV {
  function set(key: string): ReturnType<FpMMKV['set']> {
    return (value) =>
      E.tryCatch(
        () => {
          storage.set(key, value)
          return true
        },
        (e) => new WritingToStoreError({cause: e})
      )
  }

  function get(key: string): ReturnType<FpMMKV['get']> {
    return pipe(
      E.tryCatch(
        () => storage.getString(key),
        (e) => new ReadingFromStoreError({cause: e})
      ),
      E.filterOrElseW(
        (x): x is NonNullable<typeof x> => x !== null && x !== undefined,
        () => new ValueNotSet()
      )
    )
  }

  function setJSON(key: string): ReturnType<FpMMKV['setJSON']> {
    return (value) => pipe(stringifyToJson(value), E.chainW(set(key)))
  }

  function getJSON(key: string): ReturnType<FpMMKV['getJSON']> {
    return pipe(get(key), E.chainW(parseJsonFp))
  }

  const getVerified = <T extends z.ZodType>(
    key: string,
    zodType: z.TypeOf<T>
  ): E.Either<
    | WritingToStoreError
    | ValueNotSet
    | JsonParseError
    | ZodParseError<z.TypeOf<T>>
    | ReadingFromStoreError,
    z.TypeOf<T>
  > => pipe(getJSON(key), E.chainW(safeParse(zodType)))

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
