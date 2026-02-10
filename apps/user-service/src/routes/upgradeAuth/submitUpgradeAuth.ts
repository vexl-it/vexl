import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {createVexlAuthHeader, verifyChallengeResponse} from './utils'

export const submitUpgradeAuthHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'UpgradeAuth',
  'submitUpgradeAuth',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const security = yield* _(CurrentSecurity)

        yield* _(
          verifyChallengeResponse(
            req.payload.publicKeyV2,
            req.payload.challenge,
            req.payload.signature
          )
        )

        const vexlAuthHeader = yield* _(
          createVexlAuthHeader({
            hash: security.hash,
            publicKeyV2: req.payload.publicKeyV2,
          })
        )

        return {
          vexlAuthHeader,
        }
      })
    )
)
