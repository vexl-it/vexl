import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  aesGCMDecrypt,
  aesGCMEncrypt,
  aesGCMIgnoreTagDecrypt,
  aesGCMIgnoreTagEncrypt,
} from '@vexl-next/cryptography/src/operations/aes'
import {
  ecdsaSign,
  ecdsaVerify,
} from '@vexl-next/cryptography/src/operations/ecdsa'
import {
  eciesGTMDecrypt,
  eciesGTMEncrypt,
} from '@vexl-next/cryptography/src/operations/ecies'
import * as hmac from '@vexl-next/cryptography/src/operations/hmac'
import {sha256} from '@vexl-next/cryptography/src/operations/sha'
import {randomBytes} from 'crypto'
import {Effect, Schema} from 'effect'

const ECIES_GTM_CYPHER_PREFIX = 'EciesGtm-' as const
const AES_GCM_CYPHER_PREFIX = 'AesGCm-' as const

export class CryptoError extends Schema.TaggedError<CryptoError>('CryptoError')(
  'CryptoError',
  {
    message: Schema.String,
    error: Schema.optional(Schema.Unknown),
  }
) {}

export const EciesGTMECypher = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.filter((v) => v.startsWith(ECIES_GTM_CYPHER_PREFIX)),
  Schema.brand('EciesGTMECypher')
)
export type EciesGTMECypher = Schema.Schema.Type<typeof EciesGTMECypher>

export const eciesGTMEncryptE =
  (publicKey: PublicKeyPemBase64) =>
  (data: string): Effect.Effect<EciesGTMECypher, CryptoError> =>
    Effect.promise(async () => await eciesGTMEncrypt({publicKey, data})).pipe(
      Effect.map((cypher) => `${ECIES_GTM_CYPHER_PREFIX}${cypher}`),
      Effect.flatMap(Schema.decode(EciesGTMECypher)),
      Effect.catchAllDefect((e) =>
        Effect.fail(
          new CryptoError({
            message: 'Error while encrypting data with Ecies-gtm',
            error: e,
          })
        )
      ),
      Effect.catchTag('ParseError', (e) =>
        Effect.fail(
          new CryptoError({
            message:
              'Error while encrypting data with Ecies-gtm. Unable to normalize the cypher',
            error: e,
          })
        )
      )
    )

export const eciesGTMDecryptE =
  (privateKey: PrivateKeyPemBase64) =>
  (data: EciesGTMECypher): Effect.Effect<string, CryptoError> =>
    Effect.promise(
      async () =>
        await eciesGTMDecrypt({
          data: data.replace(new RegExp(`^${ECIES_GTM_CYPHER_PREFIX}`), ''),
          privateKey,
        })
    ).pipe(
      Effect.catchAllDefect(
        (e) =>
          new CryptoError({
            message: 'Unable to decode EciesGTM cypher',
            error: e,
          })
      )
    )

export const EcdsaSignature = Schema.String.pipe(Schema.brand('EcdsaSignature'))
export type EcdsaSignature = Schema.Schema.Type<typeof EcdsaSignature>

export const generateChallenge = (length: number = 32): Effect.Effect<string> =>
  Effect.sync(() =>
    randomBytes(length) // TODO might not work on FE
      .toString('base64')
  )

export const ecdsaSignE =
  (privateKey: PrivateKeyPemBase64) =>
  (challenge: string): Effect.Effect<EcdsaSignature, CryptoError> =>
    Effect.sync(() => ecdsaSign({privateKey, challenge})).pipe(
      Effect.flatMap(Schema.decode(EcdsaSignature)),
      Effect.catchAllDefect(
        (e) =>
          new CryptoError({message: 'Error while signing challenge', error: e})
      ),
      Effect.catchTag('ParseError', (e) =>
        Effect.fail(
          new CryptoError({
            message:
              'Error while signing challenge. Unable to normalize the signature',
            error: e,
          })
        )
      )
    )

export const ecdsaVerifyE =
  (publicKey: PublicKeyPemBase64) =>
  ({
    data,
    signature,
  }: {
    data: string
    signature: EcdsaSignature
  }): Effect.Effect<boolean, CryptoError> =>
    Effect.sync(() =>
      ecdsaVerify({pubKey: publicKey, challenge: data, signature})
    ).pipe(
      Effect.catchAllDefect(
        (e) =>
          new CryptoError({message: 'Unable to verify signature', error: e})
      )
    )

export const HmacHash = Schema.String.pipe(Schema.brand('HmacHash'))
export type HmacHash = Schema.Schema.Type<typeof HmacHash>

export const hmacSignE =
  (key: string) =>
  (data: string): Effect.Effect<HmacHash, CryptoError> => {
    return Effect.sync(() => hmac.hmacSign({password: key, data})).pipe(
      Effect.flatMap(Schema.decode(HmacHash)),
      Effect.catchAllDefect(
        (e) =>
          new CryptoError({
            message: 'Error while hashing data with HMAC',
            error: e,
          })
      ),
      Effect.catchTag('ParseError', (e) =>
        Effect.fail(
          new CryptoError({
            message:
              'Error while hashing data with HMAC. Unable to normalize the hash',
            error: e,
          })
        )
      )
    )
  }

export const hmacVerifyE =
  (key: string) =>
  ({
    data,
    signature,
  }: {
    data: string
    signature: HmacHash
  }): Effect.Effect<boolean, CryptoError> => {
    return Effect.sync(() =>
      hmac.hmacVerify({password: key, data, signature})
    ).pipe(
      Effect.catchAllDefect(
        (e) =>
          new CryptoError({
            message: 'Unable to verify HMAC hash',
            error: e,
          })
      )
    )
  }

export const AesGtmCypher = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.brand('AesGtmCypher')
)
export type AesGtmCypher = Schema.Schema.Type<typeof AesGtmCypher>

export const aesEncrpytE =
  (password: string, legacy: boolean = false) =>
  (data: string): Effect.Effect<AesGtmCypher, CryptoError> =>
    Effect.sync(() =>
      (legacy ? aesGCMIgnoreTagEncrypt : aesGCMEncrypt)({data, password})
    ).pipe(
      Effect.map((cypher) => `${legacy ? '' : AES_GCM_CYPHER_PREFIX}${cypher}`),
      Effect.flatMap(Schema.decode(AesGtmCypher)),
      Effect.catchAllDefect(
        (e) =>
          new CryptoError({
            message: 'Unable to encrypt AES GCM cypher',
            error: e,
          })
      ),
      Effect.catchTag('ParseError', (e) =>
        Effect.fail(
          new CryptoError({
            message: `Error while encrypting data with aes-gcm. Unable to normalize the cypher, legacy: ${legacy}`,
            error: e,
          })
        )
      )
    )

export const aesDecrpytE =
  (password: string) =>
  (cypher: AesGtmCypher): Effect.Effect<string, CryptoError> =>
    Effect.sync(() => {
      const isLegacy = !cypher.startsWith(AES_GCM_CYPHER_PREFIX)

      return (isLegacy ? aesGCMIgnoreTagDecrypt : aesGCMDecrypt)({
        data: cypher.replace(new RegExp(`^${AES_GCM_CYPHER_PREFIX}`), ''),
        password,
      })
    }).pipe(
      Effect.catchAllDefect(
        (e) =>
          new CryptoError({
            message: `Unable to encrypt AES GCM cypher, cypher: ${cypher}`,
            error: e,
          })
      )
    )

export const hashSha256 = (data: string): Effect.Effect<string, CryptoError> =>
  Effect.sync(() => sha256(data)).pipe(
    Effect.catchAllDefect(
      (e) =>
        new CryptoError({
          message: `Unable to hash data with sha256, data: ${data}`,
          error: e,
        })
    )
  )
