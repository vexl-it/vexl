import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ChallengeApiSpecification} from '@vexl-next/rest-api/src/challenges/specification'
import {Effect} from 'effect'
import {challengeExpirationMinutesConfig} from '../../../commonConfigs'
import {makeEndpointEffect} from '../../../makeEndpointEffect'
import {type ChallengePayload} from '../utils/challengePayload'
import {sealChallenge} from '../utils/sealChallenge'

export const createChallenge = HttpApiBuilder.handler(
  ChallengeApiSpecification,
  'Challenges',
  'createChallenge',
  ({payload}) =>
    Effect.gen(function* (_) {
      const expirationMinutes = yield* _(challengeExpirationMinutesConfig)
      const expiration = unixMillisecondsFromNow(expirationMinutes * 60 * 1000)

      const challengePayload: ChallengePayload = {
        publicKey: payload.publicKey,
        publicKeyV2: payload.publicKeyV2,
        expiresAt: expiration,
      }

      const sealedChallenge = yield* _(
        sealChallenge(challengePayload),
        Effect.mapError(
          (e) =>
            new UnexpectedServerError({
              message: 'Failed to create challenge',
              cause: e,
            })
        )
      )

      return {
        challenge: sealedChallenge,
        expiration,
      }
    }).pipe(makeEndpointEffect)
)
