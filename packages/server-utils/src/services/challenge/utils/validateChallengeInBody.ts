import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  InvalidChallengeError,
  type RequestBaseWithChallenge,
} from '@vexl-next/rest-api/src/challenges/contracts'

import {Effect} from 'effect'
import {type RedisLockError, type RedisService} from '../../../RedisService'
import {ChallengeService} from '../ChallengeService'

export const validateChallengeInBody = (
  body: RequestBaseWithChallenge
): Effect.Effect<
  boolean,
  UnexpectedServerError | RedisLockError | InvalidChallengeError,
  ChallengeService | RedisService
> =>
  ChallengeService.pipe(
    Effect.flatMap((challengeService) =>
      challengeService.verifyChallenge(body)
    ),
    Effect.filterOrFail(
      (one) => one,
      () => new InvalidChallengeError()
    )
  )
