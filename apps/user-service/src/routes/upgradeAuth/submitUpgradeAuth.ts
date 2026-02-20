import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {LoggedInUsersDbService} from '../../db/loggedInUsersDb'
import {createVexlAuthHeader, verifyChallengeResponse} from './utils'

export const submitUpgradeAuthHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'UpgradeAuth',
  'submitUpgradeAuth',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const security = yield* _(CurrentSecurity)
        const usersDb = yield* _(LoggedInUsersDbService)

        yield* _(
          verifyChallengeResponse(
            req.payload.publicKeyV2,
            req.payload.challenge,
            req.payload.signature
          )
        )

        yield* _(
          usersDb.updatePublicKeyV2({
            publicKey: security.publicKey,
            publicKeyV2: req.payload.publicKeyV2,
          })
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
