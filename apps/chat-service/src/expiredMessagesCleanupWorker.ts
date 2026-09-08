import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {Effect} from 'effect'
import {clearExpiredMessagesCronConfig} from './configs'
import {MessagesDbService} from './db/MessagesDbService'
import {reportMessageExpired} from './metrics'

export const clearExpiredMessagesTask = Effect.gen(function* () {
  const db = yield* MessagesDbService
  const deletedCount = yield* db.deleteExpiredMessages()

  yield* Effect.log(`Deleted ${deletedCount} expired messages`)
  yield* reportMessageExpired(deletedCount)
})

export const ExpiredMessagesCleanupWorkerLayer = makeRepeatingTaskLayer({
  queueName: 'chat-service-clear-expired-messages',
  jobName: 'clear_expired_messages',
  cronPattern: clearExpiredMessagesCronConfig,
  lockResource: 'chatService:clearExpiredMessages',
  lockDuration: '10 minutes',
  task: clearExpiredMessagesTask,
})
