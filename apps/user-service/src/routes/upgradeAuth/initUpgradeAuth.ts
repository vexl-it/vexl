import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {generateChallengeForPublicKey} from './utils'

export const initUpgradeAuthHandler = makeHttpApiHandler(
  UserApiSpecification,
  'UpgradeAuth',
  'initUpgradeAuth',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const challenge = yield* generateChallengeForPublicKey(
          req.payload.publicKeyV2
        )

        return {
          challenge,
        }
      })
    )
)
