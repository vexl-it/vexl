import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ChallengeApiSpecification} from '@vexl-next/rest-api/src/challenges/specification'
import {Array, Effect, Option} from 'effect'
import {challengeExpirationMinutesConfig} from '../../../commonConfigs'
import {makeEndpointEffect} from '../../../makeEndpointEffect'
import {sealChallenge} from '../utils/sealChallenge'

export const createChallenges = HttpApiBuilder.handler(
  ChallengeApiSpecification,
  'Challenges',
  'createChallengeBatch',
  ({payload}) =>
    Effect.gen(function* (_) {
      const expirationMinutes = yield* _(challengeExpirationMinutesConfig)
      const expiration = unixMillisecondsFromNow(expirationMinutes * 60 * 1000)

      const challenges = yield* _(
        payload.publicKeys,
        Array.map((publicKey) =>
          sealChallenge({
            publicKey,
            publicKeyV2: Option.none(),
            expiresAt: expiration,
          }).pipe(
            Effect.mapError(
              (e) =>
                new UnexpectedServerError({
                  message: 'Failed to create challenge',
                  cause: e,
                })
            ),
            Effect.map((challenge) => ({
              publicKey,
              challenge,
            }))
          )
        ),
        Effect.all
      )

      return {
        challenges,
        expiration,
      }
    }).pipe(makeEndpointEffect)
)
