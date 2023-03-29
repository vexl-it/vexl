import * as crypto from '@vexl-next/cryptography'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {type KeyHolder} from '@vexl-next/cryptography'

export interface CryptoError {
  type: 'cryptoError'
  error: unknown
}

export function ecdsaSign(
  privateKey: PrivateKeyHolder
): (challenge: string) => E.Either<CryptoError, string> {
  return (challenge: string) =>
    E.tryCatch(
      () =>
        crypto.ecdsa.ecdsaSign({
          privateKey,
          challenge,
        }),

      (error) =>
        ({
          type: 'cryptoError',
          error,
        } as const)
    )
}

export function eciesDecrypt(
  privateKey: KeyHolder.PrivateKeyHolder
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () =>
        await crypto.eciesLegacy.eciesLegacyDecrypt({data, privateKey}),
      (error) => ({type: 'cryptoError', error} as const)
    )
}

export function eciesEncrypt(
  publicKey: KeyHolder.PublicKeyHolder
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () =>
        await crypto.eciesLegacy.eciesLegacyEncrypt({data, publicKey}),
      (error) => ({type: 'cryptoError', error} as const)
    )
}

export function aesGCMIgnoreTagDecrypt(
  password: string
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () => crypto.aes.aesGCMIgnoreTagDecrypt({data, password}),
      (error) => ({type: 'cryptoError', error} as const)
    )
}

export function aesGCMIgnoreTagEncrypt(
  password: string
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () => crypto.aes.aesGCMIgnoreTagEncrypt({data, password}),
      (error) => ({type: 'cryptoError', error} as const)
    )
}
