import {HttpApiBuilder} from '@effect/platform/index'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {generateChallengeForPublicKey} from './utils'

export const initUpgradeAuthHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'UpgradeAuth',
  'initUpgradeAuth',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const challenge = yield* _(
          generateChallengeForPublicKey(req.payload.publicKeyV2)
        )

        return {
          challenge,
        }
      })
    )
)
