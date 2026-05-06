import {SqlClient, SqlResolver, SqlSchema} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {UserNotificationMqEntry} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Effect, flow, pipe, Schema} from 'effect'
import {
  PendingBatchedNotificationRecordId,
  RawPendingBatchedNotificationDbRecord,
} from './domain'

const InsertPendingNotificationParams = Schema.Struct({
  notificationData: Schema.String,
})

const BatchSize = Schema.Number

export const createInsertPendingEntries = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const insertPendingNotificationQuery = SqlSchema.void({
    Request: InsertPendingNotificationParams,
    execute: (params) => sql`
      INSERT INTO
        pending_batched_notifications (notification_data)
      VALUES
        (${params.notificationData}::jsonb)
    `,
  })

  return (
    entries: ReadonlyArray<typeof UserNotificationMqEntry.Type>
  ): Effect.Effect<void, UnexpectedServerError> =>
    pipe(
      entries,
      Effect.forEach((entry) =>
        pipe(
          entry,
          Schema.encode(Schema.parseJson(UserNotificationMqEntry)),
          Effect.flatMap((notificationData) =>
            insertPendingNotificationQuery({notificationData})
          )
        )
      ),
      Effect.asVoid,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in insertPendingBatchedNotifications', e),
          Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
        )
      ),
      Effect.withSpan('insertPendingBatchedNotifications query')
    )
})

export const createFindOldestPendingRows = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const query = SqlSchema.findAll({
    Request: BatchSize,
    Result: RawPendingBatchedNotificationDbRecord,
    execute: (batchSize) => sql`
      SELECT
        id,
        created_at,
        notification_data::text AS notification_data
      FROM
        pending_batched_notifications
      ORDER BY
        id ASC
      LIMIT
        ${batchSize}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findOldestPendingBatchedNotifications', e),
        Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
      )
    ),
    Effect.withSpan('findOldestPendingBatchedNotifications query')
  )
})

export const createDeletePendingRows = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const resolver = yield* SqlResolver.void(
    'deletePendingBatchedNotifications',
    {
      Request: PendingBatchedNotificationRecordId,
      execute: (ids) => sql`
        DELETE FROM pending_batched_notifications
        WHERE
          ${sql.in('id', ids)}
      `,
    }
  )

  return (
    ids: readonly PendingBatchedNotificationRecordId[]
  ): Effect.Effect<void, UnexpectedServerError> =>
    pipe(
      ids,
      Effect.forEach((id) => resolver.execute(id)),
      Effect.asVoid,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in deletePendingBatchedNotifications', e),
          Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
        )
      ),
      Effect.withSpan('deletePendingBatchedNotifications query')
    )
})
