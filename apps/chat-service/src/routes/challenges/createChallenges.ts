import {Schema} from '@effect/schema'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {CreateChallengeBatchEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {Handler} from 'effect-http'
import {challengeExpirationMinutesConfig} from '../../configs'
import {ChatChallengeService} from '../../utils/ChatChallengeService'

export const createChallenges = Handler.make(
  CreateChallengeBatchEndpoint,
  (req) =>
    makeEndpointEffect(
      pipe(
        req.body.publicKeys,
        Array.map((publicKey) =>
          Effect.gen(function* (_) {
            const challengeService = yield* _(ChatChallengeService)

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
