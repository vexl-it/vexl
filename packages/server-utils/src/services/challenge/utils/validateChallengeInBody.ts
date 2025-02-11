import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type RedisLockError,
  type RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {ChallengeService} from '@vexl-next/server-utils/src/services/challenge/ChallengeService'
import {
  InvalidChallengeError,
  type RequestBaseWithChallenge,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {Effect} from 'effect'

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
