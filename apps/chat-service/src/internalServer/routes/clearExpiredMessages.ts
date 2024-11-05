import {HttpServerResponse} from '@effect/platform'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'

export const clearExpiredMessages = Effect.gen(function* (_) {
  const db = yield* _(MessagesDbService)
  yield* _(db.deleteExpiredMessages())

  return HttpServerResponse.text('ok', {status: 200})
}).pipe(
  // No redis lock. What if it gets called twice? No biggie
  Effect.withSpan('Clean expired messages')
)
