import {ProcessVexlProductNotificationConsumerLayer} from '@vexl-next/server-utils/src/ContentServiceVexlProductNotificationMq'
import {Effect} from 'effect'
import {NotificationTokensDb} from './NotificationTokensDb'
import {PendingBatchedNotificationsDb} from './PendingBatchedNotificationsDb'

export const ProcessVexlProductNotificationWorker =
  ProcessVexlProductNotificationConsumerLayer((vexlProductNotification) =>
    Effect.gen(function* () {
      const pendingBatchedNotificationsDb = yield* PendingBatchedNotificationsDb
      const notificationTokensDb = yield* NotificationTokensDb
      const tokens = yield* notificationTokensDb.selectVexlTokens(
        vexlProductNotification.type === 'MARKETING' ? 'marketing' : 'general'
      )
      yield* Effect.logInfo('Selected Vexl tokens for product notification', {
        count: tokens.length,
        type: vexlProductNotification.type,
      })
      yield* pendingBatchedNotificationsDb.insertPendingForVexlProductNotification(
        vexlProductNotification,
        tokens
      )
    }).pipe(
      Effect.catch((e) =>
        Effect.logError(
          'Failed to process Vexl product notification MQ entry',
          e
        )
      )
    )
  )
