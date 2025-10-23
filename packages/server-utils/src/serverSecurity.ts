import {HttpServerRequest} from '@effect/platform'
import {UnauthorizedError} from '@vexl-next/domain/src/general/commonErrors'
import {
  SecurityHeaders,
  ServerSecurityMiddleware,
} from '@vexl-next/rest-api/src/apiSecurity'
import {Effect, Layer} from 'effect/index'
import {ServerCrypto} from './ServerCrypto'

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
