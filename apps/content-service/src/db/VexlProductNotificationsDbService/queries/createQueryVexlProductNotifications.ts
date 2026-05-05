import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlProductNotificationUuid} from '@vexl-next/domain/src/general/vexlProductNotification'
import {Array, Effect, flow, Schema} from 'effect'
import {
  VexlProductNotificationDbRecord,
  vexlProductNotificationFromDbRecord,
} from '../domain'

export const QueryVexlProductNotificationsParams = Schema.Struct({
  newerThan: Schema.DateFromSelf,
  lastVexlProductNotificationUuidFetched: Schema.optional(
    VexlProductNotificationUuid
  ),
})
export type QueryVexlProductNotificationsParams =
  typeof QueryVexlProductNotificationsParams.Type

export const createQueryVexlProductNotifications = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: QueryVexlProductNotificationsParams,
    Result: VexlProductNotificationDbRecord,
    execute: (params) => sql`
      WITH
        cursor_row AS (
          SELECT
            date,
            id
          FROM
            vexl_product_notifications
          WHERE
            UUID = CAST(${params.lastVexlProductNotificationUuidFetched ??
      null} AS uuid)
          LIMIT
            1
        )
      SELECT
        id,
        UUID,
        title,
        description,
        issue_push_notification,
        date,
        action_link,
        action_text,
        type
      FROM
        vexl_product_notifications
      WHERE
        date > ${params.newerThan}
        AND (
          CAST(${params.lastVexlProductNotificationUuidFetched ??
      null} AS uuid) IS NULL
          OR (
            EXISTS (
              SELECT
                1
              FROM
                cursor_row
            )
            AND (date, id) > (
              SELECT
                date,
                id
              FROM
                cursor_row
            )
          )
        )
      ORDER BY
        date ASC,
        id ASC
    `,
  })

  return flow(
    query,
    Effect.map(Array.map(vexlProductNotificationFromDbRecord)),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in queryVexlProductNotifications query', e),
        Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
      )
    ),
    Effect.withSpan('queryVexlProductNotifications query')
  )
})
