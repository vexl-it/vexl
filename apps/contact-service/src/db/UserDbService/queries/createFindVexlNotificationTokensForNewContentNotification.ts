import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, flow, Schema} from 'effect'

export const NewContentNotificationResults = Schema.Struct({
  vexlNotificationToken: Schema.NullOr(VexlNotificationToken),
})
export type NewContentNotificationResults =
  typeof NewContentNotificationResults.Type

export const createFindVexlNotificationTokensForNewContentNotification =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: Schema.DateFromSelf,
      Result: NewContentNotificationResults,
      execute: (params) => sql`
        SELECT
          u.vexl_notification_token
        FROM
          users u
        WHERE
          u.refreshed_at IS NOT NULL
          AND u.refreshed_at < ${params}
          AND (
            u.last_new_content_notification_sent_at IS NULL
            OR u.last_new_content_notification_sent_at < ${params}
          )
          AND (u.vexl_notification_token IS NOT NULL)
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in FindVexlNotificationTokensForNewContentNotification',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan(
        'FindVexlNotificationTokensForNewContentNotification query'
      )
    )
  })
