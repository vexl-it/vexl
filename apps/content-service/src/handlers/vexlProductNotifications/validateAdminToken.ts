import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidContentAdminTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {type ConfigError, Effect} from 'effect'
import {adminTokenConfigHash} from '../../configs'

export const validateAdminToken = (
  adminToken: string
): Effect.Effect<
  boolean,
  | InvalidContentAdminTokenError
  | ConfigError.ConfigError
  | UnexpectedServerError
> =>
  Effect.gen(function* (_) {
    const correctHash = yield* _(adminTokenConfigHash)
    const computedHash = yield* _(hashSha256(adminToken))

    if (correctHash !== computedHash) {
      return yield* _(Effect.fail(new InvalidContentAdminTokenError()))
    }

    return true
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
