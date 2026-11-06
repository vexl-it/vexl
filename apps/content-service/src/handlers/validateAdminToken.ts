import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidContentAdminTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Config, type ConfigError, Effect} from 'effect'
import {adminTokenConfigHash, contentEditorTokenHashConfig} from '../configs'

const validateTokenAgainst =
  (allowedHashes: Config.Config<readonly string[]>) =>
  (
    token: string
  ): Effect.Effect<
    void,
    | InvalidContentAdminTokenError
    | ConfigError.ConfigError
    | UnexpectedServerError
  > =>
    Effect.gen(function* (_) {
      const hashes = yield* _(allowedHashes)
      const computedHash = yield* _(hashSha256(token))

      if (!Array.contains(hashes, computedHash)) {
        return yield* _(Effect.fail(new InvalidContentAdminTokenError()))
      }
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

/** Full admin access, including product notifications pushed to every user. */
export const validateAdminToken = validateTokenAgainst(
  Config.map(adminTokenConfigHash, Array.of)
)

/** Blog posts and events only. Accepts the admin token and the content editor token. */
export const validateCmsToken = validateTokenAgainst(
  Config.all([adminTokenConfigHash, contentEditorTokenHashConfig])
)
