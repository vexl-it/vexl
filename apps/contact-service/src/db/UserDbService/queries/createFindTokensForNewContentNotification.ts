import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {NotificationTokens} from '../domain'

export const FindFirebaseTokensForNewContentNotificationResults = Schema.Struct(
  {
    ...NotificationTokens.fields,
    vexlNotificationToken: Schema.OptionFromOptionalNullOr(
      VexlNotificationToken
    ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  }
)
export type FindFirebaseTokensForNewContentNotificationResults =
  typeof FindFirebaseTokensForNewContentNotificationResults.Type

export const createFindTokensForNewContentNotification = Effect.gen(
  function* () {
    const sql = yield* PgClient.PgClient

    const query = SqlSchema.findAll({
      Request: Schema.Date,
      Result: FindFirebaseTokensForNewContentNotificationResults,
      execute: (params) => sql`
        SELECT
          u.firebase_token,
          u.expo_token,
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
          AND (
            u.firebase_token IS NOT NULL
            OR u.expo_token IS NOT NULL
            OR u.vexl_notification_token IS NOT NULL
          )
      `,
    })

    return flow(
      query,
      UnexpectedServerError.wrapErrors(
        'Error in FindFirebaseTokensForNewContentNotification'
      ),
      Effect.withSpan('FindFirebaseTokensForNewContentNotification query')
    )
  }
)
