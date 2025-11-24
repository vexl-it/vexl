import AsyncStorage from '@react-native-async-storage/async-storage'
import * as crypto from '@vexl-next/cryptography'
import {type KeyHolder} from '@vexl-next/cryptography'
import {Dimensions} from '@vexl-next/domain/src/utility/Dimensions.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {Effect, Either, Schema} from 'effect'
import * as SecretStore from 'expo-secure-store'
import {Image} from 'react-native'
import {type z, type ZodError} from 'zod'
import {type GettingImageSizeError} from '../state/chat/utils/replaceBase64UriWithImageFileUri'

export class JsonParseError extends Schema.TaggedError<JsonParseError>(
  'JsonParseError'
)('JsonParseError', {
  cause: Schema.Unknown,
}) {}

export function parseJson(json: string): Effect.Effect<any, JsonParseError> {
  return Effect.try({
    try: () => JSON.parse(json),
    catch: (e) => new JsonParseError({cause: e}),
  })
}

export interface ZodParseError<T> {
  readonly _tag: 'ParseError'
  readonly error: ZodError<T>
  readonly originalData: unknown
}

/**
 * @deprecated use schema
 */
export function safeParse<T extends z.ZodType>(
  zodType: T
): (a: unknown) => Either.Either<z.TypeOf<T>, ZodParseError<z.TypeOf<T>>> {
  return (v: unknown) => {
    const result = zodType.safeParse(v)
    if (!result.success) {
      return Either.left<ZodParseError<T>>({
        _tag: 'ParseError',
        error: result.error,
        originalData: JSON.stringify(v),
      })
    }
    return Either.right(result.data)
  }
}

export class StoreEmpty extends Schema.TaggedError<StoreEmpty>('StoreEmpty')(
  'StoreEmpty',
  {}
) {}

export class ErrorReadingFromAsyncStorage extends Schema.TaggedError<ErrorReadingFromAsyncStorage>(
  'ErrorReadingFromAsyncStorage'
)('ErrorReadingFromAsyncStorage', {
  cause: Schema.Unknown,
}) {}

export function getItemFromAsyncStorage(
  key: string
): Effect.Effect<string, StoreEmpty | ErrorReadingFromAsyncStorage> {
  return Effect.tryPromise({
    try: async () => {
      const value = await AsyncStorage.getItem(key)
      return value
    },
    catch: (e) => new ErrorReadingFromAsyncStorage({cause: e}),
  }).pipe(
    Effect.filterOrFail(
      (x): x is NonNullable<typeof x> => x != null,
      () => new StoreEmpty()
    )
  )
}

export class ErrorReadingFromSecureStorage extends Schema.TaggedError<ErrorReadingFromSecureStorage>(
  'ErrorReadingFromSecureStorage'
)('ErrorReadingFromSecureStorage', {
  cause: Schema.Unknown,
}) {}

export function getItemFromSecretStorage(
  key: string
): Effect.Effect<string, StoreEmpty | ErrorReadingFromSecureStorage> {
  return Effect.tryPromise({
    try: async () => {
      const value = await SecretStore.getItemAsync(key)
      return value
    },
    catch: (e) => new ErrorReadingFromSecureStorage({cause: e}),
  }).pipe(
    Effect.filterOrFail(
      (x): x is NonNullable<typeof x> => x != null,
      () => new StoreEmpty()
    )
  )
}
export class ErrorWritingToStore extends Schema.TaggedError<ErrorWritingToStore>(
  'ErrorWritingToStore'
)('ErrorWritingToStore', {
  cause: Schema.Unknown,
}) {}

export function saveItemToSecretStorage(
  key: string
): (value: string) => Effect.Effect<true, ErrorWritingToStore> {
  return (value: string) =>
    Effect.tryPromise({
      try: async () => {
        await SecretStore.setItemAsync(key, value)
        return true as const
      },
      catch: (e) => new ErrorWritingToStore({cause: e}),
    })
}

export function saveItemToAsyncStorage(
  key: string
): (value: string) => Effect.Effect<void, ErrorWritingToStore> {
  return (value) =>
    Effect.tryPromise({
      try: async () => {
        await AsyncStorage.setItem(key, value)
      },
      catch: (e) => new ErrorWritingToStore({cause: e}),
    })
}
export class CryptoError extends Schema.TaggedError<CryptoError>('CryptoError')(
  'CryptoError',
  {cause: Schema.Unknown}
) {}

export function aesDecrypt(
  data: string,
  password: string
): Effect.Effect<string, CryptoError> {
  return Effect.tryPromise({
    try: async () => crypto.aes.aesCTRDecrypt({data, password}),
    catch: (e) => new CryptoError({cause: e}),
  })
}

export function aesEncrypt(
  password: string
): (data: string) => Effect.Effect<string, CryptoError> {
  return (data: string) =>
    Effect.tryPromise({
      try: async () => crypto.aes.aesCTREncrypt({data, password}),
      catch: (e) => new CryptoError({cause: e}),
    })
}

export function aesGCMIgnoreTagDecrypt(
  password: string
): (data: string) => Effect.Effect<string, CryptoError> {
  return (data) =>
    Effect.tryPromise({
      try: async () => crypto.aes.aesGCMIgnoreTagDecrypt({data, password}),
      catch: (e) => new CryptoError({cause: e}),
    })
}

export function aesGCMIgnoreTagEncrypt(
  data: string,
  password: string
): Effect.Effect<string, CryptoError> {
  return Effect.tryPromise({
    try: async () => crypto.aes.aesGCMIgnoreTagEncrypt({data, password}),
    catch: (e) => new CryptoError({cause: e}),
  })
}

export function eciesDecrypt(
  privateKey: KeyHolder.PrivateKeyPemBase64
): (data: string) => Effect.Effect<string, CryptoError> {
  return (data) =>
    Effect.tryPromise({
      try: async () =>
        await crypto.eciesLegacy.eciesLegacyDecrypt({data, privateKey}),
      catch: (e) => new CryptoError({cause: e}),
    })
}

export function eciesEncrypt(
  publicKey: KeyHolder.PublicKeyPemBase64
): (data: string) => Effect.Effect<string, CryptoError> {
  return (data) =>
    Effect.tryPromise({
      try: async () =>
        await crypto.eciesLegacy.eciesLegacyEncrypt({data, publicKey}),
      catch: (e) => new CryptoError({cause: e}),
    })
}

export class JsonStringifyError extends Schema.TaggedError<JsonStringifyError>(
  'JsonStringifyError'
)('JsonStringifyError', {cause: Schema.Unknown}) {}

export function stringifyToJson(
  data: unknown
): Either.Either<string, JsonStringifyError> {
  return Either.try({
    try: () => JSON.stringify(data),
    catch: (e) => new JsonStringifyError({cause: e}),
  })
}

export function getImageSize(
  imageUri: UriString
): Effect.Effect<Dimensions, GettingImageSizeError> {
  return Effect.tryPromise({
    try: () => {
      return new Promise<Dimensions>((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => {
            resolve(
              Dimensions.parse({
                width,
                height,
              })
            )
          },
          reject
        )
      })
    },
    catch: toBasicError('GettingImageSizeError'),
  })
}
