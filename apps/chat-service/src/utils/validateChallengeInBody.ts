import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  InvalidChallengeError,
  type RequestBaseWithChallenge,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  type RedisLockError,
  type RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Effect} from 'effect'
import {ChatChallengeService} from './ChatChallengeService'

export const validateChallengeInBody = (
  body: RequestBaseWithChallenge
): Effect.Effect<
  boolean,
  UnexpectedServerError | RedisLockError | InvalidChallengeError,
  ChatChallengeService | RedisService
> =>
  ChatChallengeService.pipe(
    Effect.flatMap((chatChallengeService) =>
      chatChallengeService.verifyChallenge(body)
    ),
    Effect.filterOrFail(
      (one) => one,
      () => new InvalidChallengeError()
    )
  )
