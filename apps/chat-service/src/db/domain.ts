import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  aesDecrpytE,
  aesEncrpytE,
  AesGtmCypher,
  hashSha256,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, pipe, Schema, type Config} from 'effect'
import {easKey} from '../configs'

export const PublicKeyHashed = Schema.String.pipe(
  Schema.brand('PublicKeyHashed')
)
export type PublicKeyHashed = Schema.Schema.Type<typeof PublicKeyHashed>

export const hashPublicKey = (
  publicKey: PublicKeyPemBase64
): Effect.Effect<PublicKeyHashed, UnexpectedServerError> =>
  hashSha256(publicKey).pipe(
    Effect.flatMap(Schema.decodeEffect(PublicKeyHashed)),
    Effect.catch(
      (e) =>
        new UnexpectedServerError({
          status: 500,
          cause: e,
          message: 'Error while hashing public key',
        })
    )
  )

export const PublicKeyEncrypted = Schema.String.pipe(
  Schema.brand('PublicKeyEncrypted')
)

export type PublicKeyEncrypted = Schema.Schema.Type<typeof PublicKeyEncrypted>

const brandPublicKeyEncrypted = Schema.decodeSync(PublicKeyEncrypted)
export const encryptPublicKey = (
  publicKey: PublicKeyPemBase64
): Effect.Effect<
  PublicKeyEncrypted,
  UnexpectedServerError | Config.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const key = yield* easKey
    const encrypt = aesEncrpytE(key, true)

    return yield* pipe(
      encrypt(publicKey),
      UnexpectedServerError.wrapErrors('Error while encrypting public key'),
      Effect.map(brandPublicKeyEncrypted)
    )
  })

export const decryptPublicKey = (
  publicKey: PublicKeyEncrypted
): Effect.Effect<
  PublicKeyPemBase64,
  UnexpectedServerError | Config.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const key = yield* easKey
    const decrypt = aesDecrpytE(key)

    return yield* pipe(
      publicKey,
      Schema.decodeEffect(AesGtmCypher),
      Effect.flatMap(decrypt),
      Effect.flatMap(Schema.decodeEffect(PublicKeyPemBase64)),
      UnexpectedServerError.wrapErrors('Error while decrypting publicKey')
    )
  })
