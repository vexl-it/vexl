import {HttpApiBuilder} from '@effect/platform/index'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect} from 'effect'
import {makeEndpointEffect} from '../../../makeEndpointEffect'
import {ChallengeService} from '../ChallengeService'
import {challengeExpirationMinutesConfig} from '../db/ChallegeDbService/configs'
import {ChallengeApiSpecification} from '../specification'

export const createChallenge = HttpApiBuilder.handler(
  ChallengeApiSpecification,
  'Challenges',
  'createChallenge',
  ({payload}) =>
    Effect.gen(function* (_) {
      const challengeService = yield* _(ChallengeService)
      const publicKey = payload.publicKey
      const expirationMinutes = yield* _(challengeExpirationMinutesConfig)

      const challenge = yield* _(challengeService.createChallenge(publicKey))

      return {
        challenge,
        expiration: unixMillisecondsFromNow(expirationMinutes * 60 * 1000),
      }
    }).pipe(makeEndpointEffect)
)
