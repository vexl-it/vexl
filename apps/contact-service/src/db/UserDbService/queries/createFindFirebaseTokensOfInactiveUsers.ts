import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, flow, Schema} from 'effect'
import {NotificationTokens} from '../domain'

export const FindFirebaseTokensOfInactiveUsersResult = Schema.Struct({
  ...NotificationTokens.fields,
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
    nullable: true,
  }),
})
export type FindFirebaseTokensOfInactiveUsersResult =
  typeof FindFirebaseTokensOfInactiveUsersResult.Type

export const createFindFirebaseTokensOfInactiveUsers = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: Schema.DateFromSelf,
      Result: FindFirebaseTokensOfInactiveUsersResult,
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
            u.firebase_token IS NOT NULL
            OR u.expo_token IS NOT NULL
            OR u.vexl_notification_token IS NOT NULL
          )
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in findFirebaseTokensOfInactiveUsers', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findFirebaseTokensOfInactiveUsers query')
    )
  }
)
