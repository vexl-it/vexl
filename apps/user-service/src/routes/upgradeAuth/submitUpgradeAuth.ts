import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {LoggedInUsersDbService} from '../../db/loggedInUsersDb'
import {createVexlAuthHeader, verifyChallengeResponse} from './utils'

export const submitUpgradeAuthHandler = makeHttpApiHandler(
  UserApiSpecification,
  'UpgradeAuth',
  'submitUpgradeAuth',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const security = yield* CurrentSecurity
        const usersDb = yield* LoggedInUsersDbService

        yield* verifyChallengeResponse(
          req.payload.publicKeyV2,
          req.payload.challenge,
          req.payload.signature
        )

        yield* usersDb.updatePublicKeyV2({
          publicKey: security.publicKey,
          publicKeyV2: req.payload.publicKeyV2,
        })

        const vexlAuthHeader = yield* createVexlAuthHeader({
          hash: security.hash,
          publicKeyV2: req.payload.publicKeyV2,
        })

        return {
          vexlAuthHeader,
        }
      })
    )
)
