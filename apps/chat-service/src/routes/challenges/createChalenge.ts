import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {CreateChallengeEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {Handler} from 'effect-http'
import {challengeExpirationMinutesConfig} from '../../configs'
import {ChatChallengeService} from '../../utils/ChatChallengeService'

export const createChallenge = Handler.make(CreateChallengeEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const challengeService = yield* _(ChatChallengeService)
      const publicKey = req.body.publicKey
      const expirationMinutes = yield* _(challengeExpirationMinutesConfig)

      const challenge = yield* _(challengeService.createChallenge(publicKey))

      return {
        challenge,
        expiration: unixMillisecondsFromNow(expirationMinutes * 60 * 1000),
      }
    }),
    Schema.Void
  )
)
