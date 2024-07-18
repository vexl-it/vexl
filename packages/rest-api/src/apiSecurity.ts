import {HttpServerRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  EcdsaSignature,
  HmacHash,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect} from 'effect'
import {HttpError, Security} from 'effect-http'

export const SecurityHeaders = Schema.Struct({
  hash: HmacHash,
  signature: EcdsaSignature,
  'public-key': PublicKeyPemBase64E,
})
export type SecurityHeaders = Schema.Schema.Type<typeof SecurityHeaders>

export const verifyUserSecurity = (
  securityHeaders: SecurityHeaders
): Effect.Effect<SecurityHeaders, HttpError.HttpError, ServerCrypto> =>
  Effect.gen(function* (_) {
    const challenge = `${securityHeaders['public-key']}${securityHeaders.hash}`
    const signature = securityHeaders.signature

    const crypto = yield* _(ServerCrypto)
    const valid = yield* _(
      crypto.verifyEcdsa({data: challenge, signature}),
      Effect.catchAll((error) =>
        Effect.zipRight(
          Effect.logWarning('Error while checking security', error),
          Effect.fail(HttpError.unauthorized('Invalid auth headers'))
        )
      )
    )

    if (!valid) {
      yield* _(Effect.log('Invalid ecdsa signature in security headers'))
      return yield* _(
        Effect.fail(HttpError.unauthorized('Invalid auth headers'))
      )
    }
    return securityHeaders
  })

export const ServerSecurity = Security.make(
  HttpServerRequest.schemaHeaders(SecurityHeaders).pipe(
    Effect.mapError(() => HttpError.unauthorized('Invalid auth headers'))
  )
).pipe(Security.mapEffect(verifyUserSecurity))
