import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  AdminTokenMiddleware,
  InvalidAdminTokenError,
} from '@vexl-next/rest-api/src/adminTokenMiddleware'
import {Effect, Layer, Redacted} from 'effect'
import {adminTokenHashConfig} from './commonConfigs'
import {makeMiddlewareEffect} from './makeMiddlewareEffect'

export const AdminTokenMiddlewareLive = Layer.succeed(AdminTokenMiddleware, {
  adminToken: (token) =>
    Effect.gen(function* (_) {
      const expectedHash = yield* _(adminTokenHashConfig)
      const tokenHash = yield* _(
        hashSha256(Redacted.value(token)),
        // CryptoError carries the hashed input (the token) in its message
        Effect.catchTag('CryptoError', () =>
          Effect.fail(UnexpectedServerError.blindError())
        )
      )

      if (tokenHash !== expectedHash) {
        return yield* _(new InvalidAdminTokenError())
      }
    }).pipe(makeMiddlewareEffect(InvalidAdminTokenError)),
})
