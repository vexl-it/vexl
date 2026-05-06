import {ProcessVexlProductNotificationConsumerLayer} from '@vexl-next/server-utils/src/ContentServiceVexlProductNotificationMq'
import {Effect} from 'effect'
import {NotificationTokensDb} from './NotificationTokensDb'
import {PendingBatchedNotificationsDb} from './PendingBatchedNotificationsDb'

export const ProcessVexlProductNotificationWorker =
  ProcessVexlProductNotificationConsumerLayer((vexlProductNotification) =>
    Effect.gen(function* (_) {
      const pendingBatchedNotificationsDb = yield* _(
        PendingBatchedNotificationsDb
      )
      const notificationTokensDb = yield* _(NotificationTokensDb)
      const tokens = yield* _(
        notificationTokensDb.selectVexlTokens(
          vexlProductNotification.type === 'MARKETING' ? 'marketing' : 'general'
        )
      )
      yield* _(
        Effect.logInfo('Selected Vexl tokens for product notification', {
          count: tokens.length,
          type: vexlProductNotification.type,
        })
      )
      yield* _(
        pendingBatchedNotificationsDb.insertPendingForVexlProductNotification(
          vexlProductNotification,
          tokens
        )
      )
    }).pipe(
      Effect.catchAll((e) =>
        Effect.logError(
          'Failed to process Vexl product notification MQ entry',
          e
        )
      )
    )
  )
