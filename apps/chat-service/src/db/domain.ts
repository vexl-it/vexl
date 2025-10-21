import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  aesDecrpytE,
  aesEncrpytE,
  AesGtmCypher,
  hashSha256,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Schema, type ConfigError} from 'effect'
import {easKey} from '../configs'

export const PublicKeyHashed = Schema.String.pipe(
  Schema.brand('PublicKeyHashed')
)
export type PublicKeyHashed = Schema.Schema.Type<typeof PublicKeyHashed>

export const hashPublicKey = (
  publicKey: PublicKeyPemBase64
): Effect.Effect<PublicKeyHashed, UnexpectedServerError> =>
  hashSha256(publicKey).pipe(
    Effect.flatMap(Schema.decode(PublicKeyHashed)),
    Effect.catchAll(
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
  UnexpectedServerError | ConfigError.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const key = yield* _(easKey)
    const encrypt = aesEncrpytE(key, true)

    return yield* _(
      encrypt(publicKey),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error while encrypting public key', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.map(brandPublicKeyEncrypted)
    )
  })

export const decryptPublicKey = (
  publicKey: PublicKeyEncrypted
): Effect.Effect<
  PublicKeyPemBase64,
  UnexpectedServerError | ConfigError.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const key = yield* _(easKey)
    const decrypt = aesDecrpytE(key)

    return yield* _(
      publicKey,
      Schema.decode(AesGtmCypher),
      Effect.flatMap(decrypt),
      Effect.flatMap(Schema.decode(PublicKeyPemBase64E)),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error while decrypting publicKey', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
  })
