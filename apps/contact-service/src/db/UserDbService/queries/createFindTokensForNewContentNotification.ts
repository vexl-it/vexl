import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {NotificationTokens} from '../domain'

export const createFindTokensForNewContentNotification = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: Schema.DateFromSelf,
      Result: NotificationTokens,
      execute: (params) => sql`
        SELECT
          u.firebase_token,
          u.expo_token
        FROM
          users u
        WHERE
          u.refreshed_at IS NOT NULL
          AND u.refreshed_at < ${params}
          AND (
            u.last_new_content_notification_sent_at IS NULL
            OR u.last_new_content_notification_sent_at < ${params}
          )
          AND (
            u.firebase_token IS NOT NULL
            OR u.expo_token IS NOT NULL
          )
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in FindFirebaseTokensForNewContentNotification',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('FindFirebaseTokensForNewContentNotification query')
    )
  }
)
