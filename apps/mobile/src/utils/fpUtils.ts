import * as E from 'fp-ts/Either'
import {flow, pipe} from 'fp-ts/function'
import {type z, type ZodError} from 'zod'
import * as TE from 'fp-ts/TaskEither'
import type * as T from 'fp-ts/Task'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecretStore from 'expo-secure-store'
import * as crypto from '@vexl-next/cryptography'
import {type KeyHolder} from '@vexl-next/cryptography'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {Dimensions} from '@vexl-next/domain/dist/utility/Dimensions.brand'
import {Image} from 'react-native'
import {toBasicError} from '@vexl-next/domain/dist/utility/errors'
import {type GettingImageSizeError} from '../state/chat/utils/replaceBase64UriWithImageFileUri'

export interface JsonParseError {
  readonly _tag: 'jsonParseError'
  readonly error: unknown
}

export function parseJson(json: string): E.Either<JsonParseError, any> {
  return E.tryCatch(
    () => JSON.parse(json),
    (e) => ({_tag: 'jsonParseError', error: e})
  )
}

export interface ZodParseError<T> {
  readonly _tag: 'ParseError'
  readonly error: ZodError<T>
  readonly originalData: unknown
}

export function safeParse<T extends z.ZodType>(
  zodType: T
): (a: unknown) => E.Either<ZodParseError<z.TypeOf<T>>, z.TypeOf<T>> {
  return flow(
    E.of,
    E.chainW((v) => {
      const result = zodType.safeParse(v)
      if (!result.success) {
        return E.left<ZodParseError<T>>({
          _tag: 'ParseError',
          error: result.error,
          originalData: JSON.stringify(v),
        })
      }
      return E.right(result.data)
    })
  )
}

export interface StoreEmpty {
  readonly _tag: 'storeEmpty'
}

export interface ErrorReadingFromStore {
  readonly _tag: 'errorReadingFromStore'
  readonly error: unknown
}

export function getItemFromAsyncStorage(
  key: string
): TE.TaskEither<StoreEmpty | ErrorReadingFromStore, string> {
  return pipe(
    TE.tryCatch(
      async () => await AsyncStorage.getItem(key),
      (e) => {
        return {_tag: 'errorReadingFromStore', error: e} as const
      }
    ),
    TE.filterOrElseW(
      (x): x is NonNullable<typeof x> => x != null,
      () =>
        ({
          _tag: 'storeEmpty',
        } as const)
    )
  )
}

export function getItemFromSecretStorage(
  key: string
): TE.TaskEither<StoreEmpty | ErrorReadingFromStore, string> {
  return pipe(
    TE.tryCatch(
      async () => await SecretStore.getItemAsync(key),
      (e) => {
        return {_tag: 'errorReadingFromStore', error: e} as const
      }
    ),
    TE.filterOrElseW(
      (x): x is NonNullable<typeof x> => x != null,
      () =>
        ({
          _tag: 'storeEmpty',
        } as const)
    )
  )
}

export interface ErrorWritingToStore {
  readonly _tag: 'errorWritingToStore'
  readonly error: unknown
}

export function saveItemToSecretStorage(
  key: string
): (value: string) => TE.TaskEither<ErrorWritingToStore, true> {
  return (value: string) =>
    pipe(
      TE.tryCatch(
        async () => {
          await SecretStore.setItemAsync(key, value)
          return true as const
        },
        (e) => {
          return {_tag: 'errorWritingToStore', error: e} as const
        }
      )
    )
}

export function saveItemToAsyncStorage(
  key: string
): (value: string) => TE.TaskEither<ErrorWritingToStore, void> {
  return (value) =>
    pipe(
      TE.tryCatch(
        async () => {
          await AsyncStorage.setItem(key, value)
        },
        (e) => {
          return {_tag: 'errorWritingToStore', error: e} as const
        }
      )
    )
}

export interface CryptoError {
  readonly _tag: 'cryptoError'
  readonly e: unknown
}

export function aesDecrypt(
  data: string,
  password: string
): TE.TaskEither<CryptoError, string> {
  return TE.tryCatch(
    async () => crypto.aes.aesCTRDecrypt({data, password}),
    (e) => ({_tag: 'cryptoError', e} as const)
  )
}

export function aesEncrypt(
  password: string
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data: string) =>
    TE.tryCatch(
      async () => crypto.aes.aesCTREncrypt({data, password}),
      (e) => ({_tag: 'cryptoError', e} as const)
    )
}

export function aesGCMIgnoreTagDecrypt(
  password: string
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () => crypto.aes.aesGCMIgnoreTagDecrypt({data, password}),
      (e) => ({_tag: 'cryptoError', e} as const)
    )
}

export function aesGCMIgnoreTagEncrypt(
  data: string,
  password: string
): TE.TaskEither<CryptoError, string> {
  return TE.tryCatch(
    async () => crypto.aes.aesGCMIgnoreTagEncrypt({data, password}),
    (e) => ({_tag: 'cryptoError', e} as const)
  )
}

export function eciesDecrypt(
  privateKey: KeyHolder.PrivateKeyPemBase64
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () =>
        await crypto.eciesLegacy.eciesLegacyDecrypt({data, privateKey}),
      (e) => ({_tag: 'cryptoError', e} as const)
    )
}

export function eciesEncrypt(
  publicKey: KeyHolder.PublicKeyPemBase64
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () =>
        await crypto.eciesLegacy.eciesLegacyEncrypt({data, publicKey}),
      (e) => ({_tag: 'cryptoError', e} as const)
    )
}

export interface JsonStringifyError {
  readonly _tag: 'jsonError'
  readonly e: unknown
}

export function stringifyToJson(
  data: unknown
): E.Either<JsonStringifyError, string> {
  return E.tryCatch(
    () => JSON.stringify(data),
    (e) => ({_tag: 'jsonError', e} as const)
  )
}

export function delayInPipeT<V>(milis: number): (val: V) => T.Task<V> {
  return (val) => async () =>
    await new Promise((resolve) =>
      setTimeout(() => {
        resolve(val)
      }, milis)
    )
}

export function getImageSize(
  imageUri: UriString
): TE.TaskEither<GettingImageSizeError, Dimensions> {
  return TE.tryCatch(() => {
    return new Promise((resolve, reject) =>
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
    )
  }, toBasicError('GettingImageSizeError'))
}
