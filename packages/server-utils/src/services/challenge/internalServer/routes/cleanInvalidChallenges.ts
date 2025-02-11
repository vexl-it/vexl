import {HttpServerResponse} from '@effect/platform'
import {Effect} from 'effect'
import {ChallengeDbService} from '../../db/ChallegeDbService'

export const cleanInvalidChallenges = Effect.gen(function* (_) {
  const db = yield* _(ChallengeDbService)
  yield* _(db.deleteInvalidAndExpiredChallenges())

  return HttpServerResponse.text('ok', {status: 200})
}).pipe(
  // No redis lock. What if it gets called twice? No biggie
  Effect.withSpan('Clean invalid challenges')
)
