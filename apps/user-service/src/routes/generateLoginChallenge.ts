import {GenerateLoginChallenge} from '@vexl-next/rest-api/src/services/user/specification'
import {generateAndSignLoginChallenge} from '@vexl-next/server-utils/src/loginChallengeServerOperations'
import {Effect} from 'effect'
import {Handler} from 'effect-http'

export const generateLoginChallengeHandler = Handler.make(
  GenerateLoginChallenge,
  (_) =>
    Effect.gen(function* (_) {
      const challenge = yield* _(generateAndSignLoginChallenge())
      return {
        challenge: challenge.encodedChallenge,
        serverSignature: challenge.serverSignature,
      }
    })
)
