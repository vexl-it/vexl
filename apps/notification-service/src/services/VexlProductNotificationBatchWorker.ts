import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import {EnqueueUserNotification} from '@vexl-next/server-utils/src/UserNotificationMq'
import {RedisNamespacePrefixConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {Queue, Worker} from 'bullmq'
import {Array, Effect, Layer, Option, pipe, Schema, Stream} from 'effect'
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

  const idsToDelete = yield* _(
    pipe(
      rows,
      Effect.forEach(processPendingRow),
      Effect.map((ids) => Array.filterMap(ids, (id) => id))
    )
  )

  yield* _(db.deletePendingRows(idsToDelete))
}).pipe(
  Effect.catchAll((e) =>
    Effect.logError('Failed to issue Vexl product notification batch', e)
  ),
  Effect.withSpan('issueNotificationBatch')
)

const issueNotificationBatchWithLock = pipe(
  issueNotificationBatch,
  withRedisLock(
    ISSUE_NOTIFICATION_BATCH_LOCK_RESOURCE,
    ISSUE_NOTIFICATION_BATCH_LOCK_DURATION
  ),
  Effect.catchTag('RedisLockError', () =>
    Effect.logInfo(
      'Skipping Vexl product notification batch because another worker holds the lock'
    )
  )
)

const jobsStream = Stream.asyncScoped<undefined, never, RedisConnectionService>(
  (emit) =>
    Effect.gen(function* (_) {
      const redisConnection = yield* _(RedisConnectionService)
      const prefix = yield* _(RedisNamespacePrefixConfig)
      const intervalMs = yield* _(
        vexlProductNotificationBatchSendIntervalMsConfig
      )

      const queue = yield* _(
        Effect.acquireRelease(
          Effect.try({
            try: () =>
              new Queue(REPEAT_QUEUE_NAME, {
                connection: redisConnection,
                prefix,
                defaultJobOptions: {
                  removeOnComplete: true,
                  removeOnFail: true,
                },
              }),
            catch: (e) => e,
          }),
          (queue) =>
            Effect.promise(async () => {
              await queue.close()
            })
        )
      )

      yield* _(
        Effect.tryPromise({
          try: async () =>
            await queue.upsertJobScheduler(
              ISSUE_NOTIFICATION_BATCH_JOB_NAME,
              {every: intervalMs},
              {
                name: ISSUE_NOTIFICATION_BATCH_JOB_NAME,
                data: {},
                opts: {removeOnComplete: true, removeOnFail: true},
              }
            ),
          catch: (e) => e,
        })
      )

      yield* _(
        Effect.acquireRelease(
          Effect.try({
            try: () =>
              new Worker(
                REPEAT_QUEUE_NAME,
                async () => {
                  await emit.single(undefined)
                },
                {
                  connection: redisConnection,
                  prefix,
                  concurrency: 1,
                }
              ),
            catch: (e) => e,
          }),
          (worker) =>
            Effect.promise(async () => {
              await worker.close()
            })
        )
      )
    }).pipe(
      Effect.catchAll((e) =>
        Effect.logError(
          'Failed to start Vexl product notification batch worker',
          e
        )
      )
    )
)

export const VexlProductNotificationBatchWorkerLayer = Layer.effectDiscard(
  Stream.runForEach(jobsStream, () => issueNotificationBatchWithLock)
)
