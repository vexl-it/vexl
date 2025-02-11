import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {Handler} from 'effect-http'
import {ChallengeService} from '../ChallengeService'
import {challengeExpirationMinutesConfig} from '../db/ChallegeDbService/configs'
import {CreateChallengeEndpoint} from '../specification'

export const createChallenge = Handler.make(CreateChallengeEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const challengeService = yield* _(ChallengeService)
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
