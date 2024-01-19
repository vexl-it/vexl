import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {MMKV} from 'react-native-mmkv'
import {type z} from 'zod'
import {
  parseJson,
  safeParse,
  stringifyToJson,
  type JsonParseError,
  type JsonStringifyError,
  type ZodParseError,
} from './fpUtils'

export interface ReadingFromStoreError {
  readonly _tag: 'ReadingFromStoreError'
  readonly error: unknown
}

export interface WritingToStoreError {
  readonly _tag: 'WritingToStoreError'
  readonly error: unknown
}

export interface ValueNotSet {
  readonly _tag: 'ValueNotSet'
}

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
        (e) => ({_tag: 'WritingToStoreError', error: e}) as const
      )
  }

  function get(key: string): ReturnType<FpMMKV['get']> {
    return pipe(
      E.tryCatch(
        () => storage.getString(key),
        (e) => ({_tag: 'ReadingFromStoreError', error: e}) as const
      ),
      E.filterOrElseW(
        (x): x is NonNullable<typeof x> => x !== null && x !== undefined,
        () => ({_tag: 'ValueNotSet'}) as const
      )
    )
  }

  function setJSON(key: string): ReturnType<FpMMKV['setJSON']> {
    return (value) => pipe(stringifyToJson(value), E.chainW(set(key)))
  }

  function getJSON(key: string): ReturnType<FpMMKV['getJSON']> {
    return pipe(get(key), E.chainW(parseJson))
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
