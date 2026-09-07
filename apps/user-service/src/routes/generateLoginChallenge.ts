import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {generateAndSignLoginChallenge} from '@vexl-next/server-utils/src/loginChallengeServerOperations'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'

export const generateLoginChallengeHandler = makeHttpApiHandler(
  UserApiSpecification,
  'root',
  'generateLoginChallenge',
  (req) =>
    Effect.gen(function* () {
      const challenge = yield* generateAndSignLoginChallenge()
      return {
        challenge: challenge.encodedChallenge,
        serverSignature: challenge.serverSignature,
      }
    }).pipe(makeEndpointEffect)
)
