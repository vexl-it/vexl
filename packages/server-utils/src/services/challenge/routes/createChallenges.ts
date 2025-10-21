import {HttpApiBuilder} from '@effect/platform/index'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, pipe} from 'effect'
import {makeEndpointEffect} from '../../../makeEndpointEffect'
import {ChallengeService} from '../ChallengeService'
import {challengeExpirationMinutesConfig} from '../db/ChallegeDbService/configs'
import {ChallengeApiSpecification} from '../specification'

export const createChallenges = HttpApiBuilder.handler(
  ChallengeApiSpecification,
  'Challenges',
  'createChallengeBatch',
  ({payload}) =>
    pipe(
      payload.publicKeys,
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
            expiration: unixMillisecondsFromNow(expirationMinutes * 60 * 1000),
          }))
        )
      )
    ).pipe(makeEndpointEffect)
)
