import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  BadShortLivedTokenForErasingUserOnContactServiceError,
  ShortLivedTokenForErasingUserOnContactService,
  ShortLivedTokenForErasingUserOnContactServicePayload,
} from '@vexl-next/domain/src/general/ShortLivedTokenForErasingUserOnContactService'
import {
  unixMillisecondsFromNow,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  AesGtmCypher,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, pipe, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {ServerCrypto} from './ServerCrypto'

const SHORT_LIVED_TOKEN_EXPIRES_AFTER_MILIS = 1000 * 60 * 5 // 5 mins

export const createShortLivedTokenForErasingUser = (
  phoneNumberHash: HashedPhoneNumber
): Effect.Effect<
  ShortLivedTokenForErasingUserOnContactService,
  SchemaError | CryptoError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const expiresAt = unixMillisecondsFromNow(
      SHORT_LIVED_TOKEN_EXPIRES_AFTER_MILIS
    )

    const crypto = yield* ServerCrypto
    return yield* pipe(
      crypto.encryptAES(ShortLivedTokenForErasingUserOnContactServicePayload)({
        phoneNumberHash,
        expiresAt,
      }),
      Effect.flatMap(
        Schema.decodeEffect(ShortLivedTokenForErasingUserOnContactService)
      )
    )
  })

export const verifyAndDecodeShortLivedTokenForErasingUser = (
  token: ShortLivedTokenForErasingUserOnContactService
): Effect.Effect<
  ShortLivedTokenForErasingUserOnContactServicePayload,
  BadShortLivedTokenForErasingUserOnContactServiceError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const crypto = yield* ServerCrypto
    const decryptedToken = yield* pipe(
      Schema.decodeEffect(AesGtmCypher)(token),
      Effect.flatMap(
        crypto.decryptAES(ShortLivedTokenForErasingUserOnContactServicePayload)
      ),
      Effect.catch(() =>
        Effect.fail(
          new BadShortLivedTokenForErasingUserOnContactServiceError({
            reason: 'CryptoError',
            status: 400,
          })
        )
      )
    )

    if (decryptedToken.expiresAt < unixMillisecondsNow()) {
      return yield* new BadShortLivedTokenForErasingUserOnContactServiceError({
        reason: 'Expired',
        status: 400,
      })
    }

    return decryptedToken
  })
