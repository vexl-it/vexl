import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {Effect} from 'effect'
import {clearExpiredMessagesCronConfig} from './configs'
import {MessagesDbService} from './db/MessagesDbService'
import {reportMessageExpired} from './metrics'

export const clearExpiredMessagesTask = Effect.gen(function* (_) {
  const db = yield* _(MessagesDbService)
  const deletedCount = yield* _(db.deleteExpiredMessages())

  yield* _(Effect.log(`Deleted ${deletedCount} expired messages`))
  yield* _(reportMessageExpired(deletedCount))
})

export const ExpiredMessagesCleanupWorkerLayer = makeRepeatingTaskLayer({
  queueName: 'chat-service-clear-expired-messages',
  jobName: 'clear_expired_messages',
  cronPattern: clearExpiredMessagesCronConfig,
  lockResource: 'chatService:clearExpiredMessages',
  lockDuration: '10 minutes',
  task: clearExpiredMessagesTask,
})
