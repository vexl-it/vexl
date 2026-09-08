import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidAdminTokenError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, type Config} from 'effect'
import {adminTokenConfigHash} from '../../../configs'

export const validateAdminToken = (
  adminToken: string
): Effect.Effect<
  true,
  InvalidAdminTokenError | Config.ConfigError | UnexpectedServerError
> =>
  Effect.gen(function* () {
    const correctHash = yield* adminTokenConfigHash
    const computedHash = yield* hashSha256(adminToken)

    if (correctHash !== computedHash) {
      return yield* Effect.fail(new InvalidAdminTokenError())
    }
    return true as const
  }).pipe(
    Effect.catchTag(
      'CryptoError',
      (e) =>
        new UnexpectedServerError({
          status: 500,
          message: 'Error in hashSha256',
          cause: e,
        })
    )
  )
