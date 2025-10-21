import {HttpApiBuilder} from '@effect/platform/index'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {generateAndSignLoginChallenge} from '@vexl-next/server-utils/src/loginChallengeServerOperations'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'

export const generateLoginChallengeHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'root',
  'generateLoginChallenge',
  (req) =>
    Effect.gen(function* (_) {
      const challenge = yield* _(generateAndSignLoginChallenge())
      return {
        challenge: challenge.encodedChallenge,
        serverSignature: challenge.serverSignature,
      }
    }).pipe(makeEndpointEffect)
)
