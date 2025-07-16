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
import {Effect, Schema} from 'effect/index'
import {type ParseError} from 'effect/ParseResult'
import {ServerCrypto} from './ServerCrypto'

const SHORT_LIVED_TOKEN_EXPIRES_AFTER_MILIS = 1000 * 60 * 5 // 5 mins

export const createShortLivedTokenForErasingUser = (
  phoneNumberHash: HashedPhoneNumber
): Effect.Effect<
  ShortLivedTokenForErasingUserOnContactService,
  ParseError | CryptoError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const expiresAt = unixMillisecondsFromNow(
      SHORT_LIVED_TOKEN_EXPIRES_AFTER_MILIS
    )

    const crypto = yield* _(ServerCrypto)
    return yield* _(
      crypto.encryptAES(ShortLivedTokenForErasingUserOnContactServicePayload)({
        phoneNumberHash,
        expiresAt,
      }),
      Effect.flatMap(
        Schema.decode(ShortLivedTokenForErasingUserOnContactService)
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
  Effect.gen(function* (_) {
    const crypto = yield* _(ServerCrypto)
    const decryptedToken = yield* _(
      Schema.decode(AesGtmCypher)(token),
      Effect.flatMap(
        crypto.decryptAES(ShortLivedTokenForErasingUserOnContactServicePayload)
      ),
      Effect.catchAll(() =>
        Effect.fail(
          new BadShortLivedTokenForErasingUserOnContactServiceError({
            reason: 'CryptoError',
            status: 400,
          })
        )
      )
    )

    if (decryptedToken.expiresAt < unixMillisecondsNow()) {
      return yield* _(
        new BadShortLivedTokenForErasingUserOnContactServiceError({
          reason: 'Expired',
          status: 400,
        })
      )
    }

    return decryptedToken
  })
