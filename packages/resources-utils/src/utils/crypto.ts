import * as crypto from '@vexl-next/cryptography'
import {type KeyHolder} from '@vexl-next/cryptography'
import {
  type PrivateKeyHolder,
  type PrivateKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {
  CryptoError as CryptoErrorE,
  EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {createHash} from 'crypto'
import {Effect, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'

export type CryptoError = BasicError<'CryptoError'>

export function ecdsaSign(
  privateKey: PrivateKeyHolder
): (challenge: string) => E.Either<CryptoError, EcdsaSignature> {
  return (challenge: string) =>
    pipe(
      E.tryCatch(
        () =>
          crypto.ecdsa.ecdsaSign({
            privateKey: privateKey.privateKeyPemBase64,
            challenge,
          }),
        toError('CryptoError', 'Error while signing challenge')
      ),
      E.map(Schema.decodeSync(EcdsaSignature))
    )
}

export function eciesDecryptE(
  privateKey: PrivateKeyPemBase64
): (data: string) => Effect.Effect<string, CryptoErrorE> {
  return (data) =>
    Effect.tryPromise({
      try: async () =>
        await crypto.eciesLegacy.eciesLegacyDecrypt({data, privateKey}),
      catch: (error) =>
        new CryptoErrorE({
          message: 'Error while decrypting data',
          error,
        }),
    })
}

export function eciesDecrypt(
  privateKey: PrivateKeyPemBase64
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () => {
        return await crypto.eciesLegacy.eciesLegacyDecrypt({data, privateKey})
      },
      toError('CryptoError', 'Error while decrypting data')
    )
}

export function eciesEncryptE(
  publicKey: KeyHolder.PublicKeyPemBase64
): (data: string) => Effect.Effect<string, CryptoErrorE> {
  return (data) =>
    Effect.tryPromise({
      try: async () =>
        await crypto.eciesLegacy.eciesLegacyEncrypt({
          data,
          publicKey,
        }),
      catch: (error) =>
        new CryptoErrorE({
          message: 'Error while encrypting data',
          error,
        }),
    })
}

export function eciesEncrypt(
  publicKey: KeyHolder.PublicKeyPemBase64
): (data: string) => TE.TaskEither<CryptoError, string> {
  return (data) =>
    TE.tryCatch(
      async () =>
        await crypto.eciesLegacy.eciesLegacyEncrypt({
          data,
          publicKey,
        }),
      toError('CryptoError', 'Error while encrypting data')
    )
}

export function aesGCMIgnoreTagDecrypt(
  password: string
): (data: string) => Effect.Effect<string, CryptoErrorE> {
  return (data) =>
    Effect.tryPromise({
      try: async () => crypto.aes.aesGCMIgnoreTagDecrypt({data, password}),
      catch(error) {
        return new CryptoErrorE({
          message: 'Error while decrypting data',
          error,
        })
      },
    })
}

export function aesGCMIgnoreTagEncrypt(
  password: string
): (data: string) => Effect.Effect<string, CryptoErrorE> {
  return (data) =>
    Effect.tryPromise({
      try: async () => crypto.aes.aesGCMIgnoreTagEncrypt({data, password}),
      catch(error) {
        return new CryptoErrorE({
          message: 'Error while encrypting data',
          error,
        })
      },
    })
}

export function hmacSign(
  password: string
): (data: string) => E.Either<CryptoError, string> {
  return (data) =>
    E.tryCatch(
      () => crypto.hmac.hmacSign({data, password}),
      toError('CryptoError', 'Error while signing data')
    )
}

export function importKeyPair(
  privateKey: PrivateKeyPemBase64
): E.Either<CryptoError, PrivateKeyHolder> {
  return E.tryCatch(
    () => crypto.KeyHolder.importKeyPair(privateKey),
    toError('CryptoError', 'Error while importing key pair')
  )
}

export function generateKeyPair(): E.Either<CryptoError, PrivateKeyHolder> {
  return E.tryCatch(
    () => crypto.KeyHolder.generatePrivateKey(),
    toError('CryptoError', 'Error while generating new key pair')
  )
}

export function hashMD5(payload: string): E.Either<CryptoError, string> {
  return E.tryCatch(
    () => {
      return createHash('md5')
        .update(payload, 'utf-8')
        .digest()
        .toString('base64')
    },
    toError('CryptoError', 'error while creating hash')
  )
}
