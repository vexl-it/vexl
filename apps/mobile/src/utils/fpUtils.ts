import AsyncStorage from '@react-native-async-storage/async-storage'
import * as crypto from '@vexl-next/cryptography'
import {type KeyHolder} from '@vexl-next/cryptography'
import {Dimensions} from '@vexl-next/domain/src/utility/Dimensions.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {
  effectToEither,
  effectToTaskEither,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, Schema} from 'effect'
import * as SecretStore from 'expo-secure-store'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {flow} from 'fp-ts/function'
import {Image} from 'react-native'
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
export const parseJsonFp = flow(parseJson, effectToEither)

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
export const getItemFromAsyncStorageFp = flow(
  getItemFromAsyncStorage,
  effectToTaskEither
)

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
export const getItemFromSecretStorageFp = flow(
  getItemFromSecretStorage,
  effectToTaskEither
)
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
export const saveItemToSecretStorageFp =
  (key: string) =>
  (value: string): TE.TaskEither<ErrorWritingToStore, true> =>
    effectToTaskEither(saveItemToSecretStorage(key)(value))

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
export const saveItemToAsyncStorageFp =
  (key: string) =>
  (value: string): TE.TaskEither<ErrorWritingToStore, void> =>
    effectToTaskEither(saveItemToAsyncStorage(key)(value))
export class CryptoError extends Schema.TaggedError<CryptoError>('CryptoError')(
  'CryptoError',
  {cause: Schema.Unknown}
) {}

export function aesDecrypt(
  data: string,
  password: string
): TE.TaskEither<CryptoError, string> {
  return TE.tryCatch(
    async () => crypto.aes.aesCTRDecrypt({data, password}),
    (e) => new CryptoError({cause: e})
  )
}

export function aesEncrypt(
  password: string
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data: string) =>
    TE.tryCatch(
      async () => crypto.aes.aesCTREncrypt({data, password}),
      (e) => new CryptoError({cause: e})
    )
}

export function aesGCMIgnoreTagDecrypt(
  password: string
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () => crypto.aes.aesGCMIgnoreTagDecrypt({data, password}),
      (e) => new CryptoError({cause: e})
    )
}

export function aesGCMIgnoreTagEncrypt(
  data: string,
  password: string
): TE.TaskEither<CryptoError, string> {
  return TE.tryCatch(
    async () => crypto.aes.aesGCMIgnoreTagEncrypt({data, password}),
    (e) => new CryptoError({cause: e})
  )
}

export function eciesDecrypt(
  privateKey: KeyHolder.PrivateKeyPemBase64
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () =>
        await crypto.eciesLegacy.eciesLegacyDecrypt({data, privateKey}),
      (e) => new CryptoError({cause: e})
    )
}

export function eciesEncrypt(
  publicKey: KeyHolder.PublicKeyPemBase64
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () =>
        await crypto.eciesLegacy.eciesLegacyEncrypt({data, publicKey}),
      (e) => new CryptoError({cause: e})
    )
}

export class JsonStringifyError extends Schema.TaggedError<JsonStringifyError>(
  'JsonStringifyError'
)('JsonStringifyError', {cause: Schema.Unknown}) {}

export function stringifyToJson(
  data: unknown
): E.Either<JsonStringifyError, string> {
  return E.tryCatch(
    () => JSON.stringify(data),
    (e) => new JsonStringifyError({cause: e})
  )
}

export function getImageSize(
  imageUri: UriString
): TE.TaskEither<GettingImageSizeError, Dimensions> {
  return TE.tryCatch(() => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => {
          resolve(
            Schema.decodeSync(Dimensions)({
              width,
              height,
            })
          )
        },
        reject
      )
    })
  }, toBasicError('GettingImageSizeError'))
}
