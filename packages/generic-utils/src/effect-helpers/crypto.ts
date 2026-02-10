import {cryptobox, type KeyHolder} from '@vexl-next/cryptography'
import {getCrypto} from '@vexl-next/cryptography/src/getCrypto'
import {
  type PrivateKeyPemBase64,
  type PrivateKeyV2,
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  aesCTRDecryptPromise,
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
import pbkdf2Promise from '@vexl-next/cryptography/src/operations/pbkdf2Promise'
import {sha256} from '@vexl-next/cryptography/src/operations/sha'
import {Effect, Schema} from 'effect'
import * as EcdaBrands from './EcdsaSignature.brand'

export const ECIES_GTM_CYPHER_PREFIX = 'EciesGtm-' as const
const AES_GCM_CYPHER_PREFIX = 'AesGCm-' as const
const CRYPTO_BOX_CYPHER_PREFIX = 'CBCiph-' as const
const CRYPTO_BOX_SIGNATURE_PREFIX = 'CBSig-' as const

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
export type EciesGTMECypher = typeof EciesGTMECypher.Type

export const CryptoBoxCypher = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.filter((v) => v.startsWith(CRYPTO_BOX_CYPHER_PREFIX)),
  Schema.brand('CryptoBoxCypher')
)

export type CryptoBoxCypher = typeof CryptoBoxCypher.Type

export const CryptoBoxSignature = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.filter((v) => v.startsWith(CRYPTO_BOX_SIGNATURE_PREFIX)),
  Schema.brand('CryptoBoxSignature')
)
export type CryptoBoxSignature = typeof CryptoBoxSignature.Type

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

export const generateChallenge = (length: number = 32): Effect.Effect<string> =>
  Effect.sync(() =>
    getCrypto()
      .randomBytes(length) // TODO might not work on FE
      .toString('base64')
  )

export const EcdsaSignature = EcdaBrands.EcdsaSignature
export type EcdsaSignature = EcdaBrands.EcdsaSignature

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

/**
 * @deprecated use aesDecrypt that uses aes GCM instead of aes CTR
 * @param password
 * @returns
 */
export const aesCTRDecrypt =
  (password: string) =>
  (cypher: string): Effect.Effect<string, CryptoError> =>
    Effect.tryPromise({
      try: async () =>
        await aesCTRDecryptPromise({
          data: cypher,
          password,
        }),
      catch: (e) =>
        new CryptoError({
          message: 'Error aes ctr decrypt',
          error: e,
        }),
    })

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

export const pbkdf2 = (
  {
    password,
    salt,
    iterations,
  }: {
    password: string
    salt: string
    iterations: number
  },
  {
    keylen = 32,
    digest = 'sha512',
    outputEncoding = 'base64',
  }: {keylen: number; digest: string; outputEncoding: BufferEncoding} = {
    keylen: 32,
    digest: 'sha512',
    outputEncoding: 'base64',
  }
): Effect.Effect<string, CryptoError> =>
  Effect.tryPromise({
    try: async () => {
      const resultBuffer = await pbkdf2Promise(
        password,
        salt,
        iterations,
        keylen,
        digest
      )
      return resultBuffer.toString(outputEncoding)
    },
    catch: (e) =>
      new CryptoError({
        message: 'Error while performing pbkdf2',
        error: e,
      }),
  })

export const cryptoBoxSeal =
  (publicKey: KeyHolder.PublicKeyV2) =>
  (data: string): Effect.Effect<CryptoBoxCypher, CryptoError> =>
    Effect.tryPromise({
      try: async () => {
        const toReturn = await cryptobox.seal(data, publicKey)
        return `${CRYPTO_BOX_CYPHER_PREFIX}${toReturn}`
      },
      catch: (error) =>
        new CryptoError({
          message: 'Error while encrypting data with cryptobox',
          error,
        }),
    }).pipe(Effect.map(Schema.decodeSync(CryptoBoxCypher)))

export const cryptoBoxUnseal =
  (keyPairV2: KeyHolder.KeyPairV2) =>
  (data: CryptoBoxCypher): Effect.Effect<string, CryptoError> =>
    Effect.tryPromise({
      // eslint-disable-next-line @typescript-eslint/return-await
      try: async () =>
        await cryptobox.unseal(
          data.slice(CRYPTO_BOX_CYPHER_PREFIX.length),
          keyPairV2
        ),
      catch: (error) =>
        new CryptoError({
          message: 'Error while encrypting data with cryptobox',
          error,
        }),
    })

export const cryptoBoxSign =
  (privateKey: KeyHolder.PrivateKeyV2) =>
  (message: string): Effect.Effect<CryptoBoxSignature, CryptoError> =>
    Effect.tryPromise({
      try: async () => {
        const signature = await cryptobox.sign(message, privateKey)
        return `${CRYPTO_BOX_SIGNATURE_PREFIX}${signature}`
      },
      catch: (error) =>
        new CryptoError({
          message: 'Error while signing data with cryptobox',
          error,
        }),
    }).pipe(
      Effect.map((signature) =>
        Schema.decodeSync(CryptoBoxSignature)(signature)
      )
    )

export const cryptoBoxVerifySignature =
  (publicKey: KeyHolder.PublicKeyV2) =>
  (message: string, signature: CryptoBoxSignature) =>
    Effect.tryPromise({
      try: async () => {
        return await cryptobox.verifySignature(
          message,
          signature.slice(CRYPTO_BOX_SIGNATURE_PREFIX.length),
          publicKey
        )
      },
      catch: (error) =>
        new CryptoError({
          message: 'Error while verifying signature with cryptobox',
          error,
        }),
    })

export const derivePubKey = (
  privateKey: PrivateKeyV2
): Effect.Effect<PublicKeyV2, CryptoError> =>
  Effect.tryPromise({
    try: async () => {
      return await cryptobox.derivePubKey(privateKey)
    },
    catch: (error) =>
      new CryptoError({
        message: 'Error while deriving public key from private key',
        error,
      }),
  })
