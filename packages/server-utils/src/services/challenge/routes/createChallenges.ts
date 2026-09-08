import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ChallengeApiSpecification} from '@vexl-next/rest-api/src/challenges/specification'
import {Array, Effect, Option, pipe} from 'effect'
import {challengeExpirationMinutesConfig} from '../../../commonConfigs'
import {makeEndpointEffect} from '../../../makeEndpointEffect'
import {makeHttpApiHandler} from '../../../makeHttpApiHandler'
import {sealChallenge} from '../utils/sealChallenge'

export const createChallenges = makeHttpApiHandler(
  ChallengeApiSpecification,
  'Challenges',
  'createChallengeBatch',
  ({payload}) =>
    Effect.gen(function* () {
      const expirationMinutes = yield* challengeExpirationMinutesConfig
      const expiration = unixMillisecondsFromNow(expirationMinutes * 60 * 1000)

      const challenges = yield* pipe(
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
