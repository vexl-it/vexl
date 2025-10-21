import {HttpApiMiddleware, HttpServerRequest} from '@effect/platform'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnauthorizedError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Context, Effect, Layer, Schema} from 'effect'

export const SecurityHeaders = Schema.Struct({
  hash: HashedPhoneNumberE,
  signature: EcdsaSignature,
  'public-key': PublicKeyPemBase64E,
})
export type SecurityHeaders = Schema.Schema.Type<typeof SecurityHeaders>

export const verifyUserSecurity = (
  securityHeaders: SecurityHeaders
): Effect.Effect<SecurityHeaders, UnauthorizedError, ServerCrypto> =>
  Effect.gen(function* (_) {
    const challenge = `${securityHeaders['public-key']}${securityHeaders.hash}`
    const signature = securityHeaders.signature

    const crypto = yield* _(ServerCrypto)
    const valid = yield* _(
      crypto.verifyEcdsa({data: challenge, signature}),
      Effect.catchAll((error) =>
        Effect.zipRight(
          Effect.logWarning('Error while checking security', error),
          Effect.fail(
            new UnauthorizedError({
              cause: new Error('Invalid auth headers'),
              status: 401,
            })
          )
        )
      )
    )

    if (!valid) {
      yield* _(Effect.log('Invalid ecdsa signature in security headers'))
      return yield* _(
        Effect.fail(
          new UnauthorizedError({
            cause: new Error('Invalid auth headers'),
            status: 401,
          })
        )
      )
    }
    return securityHeaders
  })

export class CurrentSecurity extends Context.Tag('CurrentSecurity')<
  CurrentSecurity,
  SecurityHeaders
>() {}

export class ServerSecurityMiddleware extends HttpApiMiddleware.Tag<ServerSecurityMiddleware>()(
  'ServerSecurityMiddleware',
  {
    optional: false,
    provides: CurrentSecurity,
    failure: UnauthorizedError,
  }
) {}

export const ServerSecurityMiddlewareLive = Layer.effect(
  ServerSecurityMiddleware,
  Effect.gen(function* (_) {
    const crypto = yield* _(ServerCrypto)
    return Effect.gen(function* (_) {
      const securityHeaders = yield* _(
        HttpServerRequest.schemaHeaders(SecurityHeaders),
        Effect.mapError(
          () =>
            new UnauthorizedError({
              cause: new Error('Missing required headers'),
              status: 401,
            })
        )
      )

      const challenge = `${securityHeaders['public-key']}${securityHeaders.hash}`
      const signature = securityHeaders.signature

      const valid = yield* _(
        crypto.verifyEcdsa({data: challenge, signature}),
        Effect.catchAll((error) =>
          Effect.zipRight(
            Effect.logWarning('Error while checking security', error),
            Effect.fail(
              new UnauthorizedError({
                cause: new Error('Invalid auth headers'),
                status: 401,
              })
            )
          )
        )
      )

      if (!valid) {
        yield* _(Effect.log('Invalid ecdsa signature in security headers'))
        return yield* _(
          Effect.fail(
            new UnauthorizedError({
              cause: new Error('Invalid auth headers'),
              status: 401,
            })
          )
        )
      }

      return securityHeaders
    })
  })
)
