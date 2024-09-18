import {Schema} from '@effect/schema'
import {generateChallenge} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CreateChallengeEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'

export const createChallenge = Handler.make(
  CreateChallengeEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const challenge = yield* _(generateChallenge())
      }),
      Schema.Void
    )
)
