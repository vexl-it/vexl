import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe, Schema} from 'effect'
import {Handler} from 'effect-http'
import {ChallengeService} from '../ChallengeService'
import {challengeExpirationMinutesConfig} from '../db/ChallegeDbService/configs'
import {CreateChallengeBatchEndpoint} from '../specification'

export const createChallenges = Handler.make(
  CreateChallengeBatchEndpoint,
  (req) =>
    makeEndpointEffect(
      pipe(
        req.body.publicKeys,
        Array.map((publicKey) =>
          Effect.gen(function* (_) {
            const challengeService = yield* _(ChallengeService)

            const challenge = yield* _(
              challengeService.createChallenge(publicKey)
            )

            return {
              publicKey,
              challenge,
            }
          })
        ),
        Effect.all,
        Effect.flatMap((v) =>
          challengeExpirationMinutesConfig.pipe(
            Effect.map((expirationMinutes) => ({
              challenges: v,
              expiration: unixMillisecondsFromNow(
                expirationMinutes * 60 * 1000
              ),
            }))
          )
        )
      ),
      Schema.Void
    )
)
