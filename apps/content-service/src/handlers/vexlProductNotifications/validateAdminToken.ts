import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidContentAdminTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, type Config} from 'effect'
import {adminTokenConfigHash} from '../../configs'

export const validateAdminToken = (
  adminToken: string
): Effect.Effect<
  boolean,
  InvalidContentAdminTokenError | Config.ConfigError | UnexpectedServerError
> =>
  Effect.gen(function* () {
    const correctHash = yield* adminTokenConfigHash
    const computedHash = yield* hashSha256(adminToken)

    if (correctHash !== computedHash) {
      return yield* Effect.fail(new InvalidContentAdminTokenError())
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
