import {HttpServerResponse} from '@effect/platform'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {reportMessageExpired} from '../../metrics'

export const clearExpiredMessages = Effect.gen(function* (_) {
  const db = yield* _(MessagesDbService)
  const deletedCount = yield* _(db.deleteExpiredMessages())

  yield* _(Effect.log(`Deleted ${deletedCount} expired messages`))
  yield* _(reportMessageExpired(deletedCount))

  return HttpServerResponse.text('ok')
}).pipe(
  // No redis lock. What if it gets called twice? No biggie
  Effect.withSpan('Clean expired messages')
)
