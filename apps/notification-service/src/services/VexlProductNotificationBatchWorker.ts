import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {EnqueueUserNotification} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {
  vexlProductNotificationBatchSendIntervalMsConfig,
  vexlProductNotificationBatchSizeConfig,
} from '../configs'
import {
  PendingBatchedNotificationDbRecord,
  PendingBatchedNotificationsDb,
  type PendingBatchedNotificationRecordId,
  type RawPendingBatchedNotificationDbRecord,
} from './PendingBatchedNotificationsDb'

const REPEAT_QUEUE_NAME = 'notification-service-repeatable-jobs'
const ISSUE_NOTIFICATION_BATCH_JOB_NAME = 'issue_notification_batch'
const ISSUE_NOTIFICATION_BATCH_LOCK_RESOURCE =
  'notification-service:vexl-product-notification-batch'
const ISSUE_NOTIFICATION_BATCH_LOCK_DURATION = '5 minutes'
type EnqueueUserNotificationContext =
  'mqService/contact-service_new-user-notifications-processing-queue'

const processPendingRow = (
  row: RawPendingBatchedNotificationDbRecord
): Effect.Effect<
  Option.Option<PendingBatchedNotificationRecordId>,
  never,
  EnqueueUserNotificationContext
> =>
  pipe(
    Schema.decode(PendingBatchedNotificationDbRecord)(row),
    Effect.matchEffect({
      onFailure: (e) =>
        Effect.zipRight(
          Effect.logError(
            'Invalid pending Vexl product notification JSON',
            e,
            row
          ),
          Effect.succeed(Option.some(row.id))
        ),
      onSuccess: (decoded) =>
        pipe(
          EnqueueUserNotification,
          Effect.flatMap((enqueue) =>
            enqueue(decoded.notificationData, {delay: 0})
          ),
          Effect.as(Option.some(row.id)),
          Effect.catchAll((e) =>
            Effect.zipRight(
              Effect.logError(
                'Failed to enqueue pending Vexl product notification',
                e,
                decoded
              ),
              Effect.succeed(Option.none<PendingBatchedNotificationRecordId>())
            )
          )
        ),
    })
  )

export const issueNotificationBatch = Effect.gen(function* (_) {
  const db = yield* _(PendingBatchedNotificationsDb)
  const batchSize = yield* _(vexlProductNotificationBatchSizeConfig)
  const rows = yield* _(db.findOldestPendingRows(batchSize))

  yield* _(
    Effect.log('Issuing notifications batch', {count: Array.length(rows)})
  )
  const idsToDelete = yield* _(
    pipe(
      rows,
      Effect.forEach(processPendingRow),
      Effect.map((ids) => Array.filterMap(ids, (id) => id))
    )
  )

  yield* _(Effect.log('Notifications issued', {count: Array.length(rows)}))
  yield* _(db.deletePendingRows(idsToDelete))
}).pipe(
  Effect.catchAll((e) =>
    Effect.logError('Failed to issue Vexl product notification batch', e)
  ),
  Effect.withSpan('issueNotificationBatch')
)

export const VexlProductNotificationBatchWorkerLayer = makeRepeatingTaskLayer({
  queueName: REPEAT_QUEUE_NAME,
  jobName: ISSUE_NOTIFICATION_BATCH_JOB_NAME,
  intervalMs: vexlProductNotificationBatchSendIntervalMsConfig,
  lockResource: ISSUE_NOTIFICATION_BATCH_LOCK_RESOURCE,
  lockDuration: ISSUE_NOTIFICATION_BATCH_LOCK_DURATION,
  task: issueNotificationBatch,
})
