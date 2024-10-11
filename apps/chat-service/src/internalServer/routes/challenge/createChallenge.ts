import {Schema} from '@effect/schema'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {CreateChallengeEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {challengeExpirationMinutesConfig} from '../../../configs'
import {ChatChallengeService} from '../../../utils/ChatChallengeService'

export const createChallenge = Handler.make(CreateChallengeEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const challengeService = yield* _(ChatChallengeService)
      const challenge = yield* _(
        challengeService.createChallenge(req.body.publicKey)
      )

      return {
        challenge,
        expiration: unixMillisecondsFromNow(
          (yield* _(challengeExpirationMinutesConfig)) * 60 * 1000
        ),
      }
    }),
    Schema.Void
  )
)
