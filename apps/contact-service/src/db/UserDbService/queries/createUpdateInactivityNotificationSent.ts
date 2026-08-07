import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {UserInactivityNotificationVariant} from '@vexl-next/domain/src/general/notifications'
import {Effect, flow, Schema} from 'effect'
import {UserRecordId} from '../domain'

export const UpdateInactivityNotificationSentParams = Schema.Struct({
  ids: Schema.Array(UserRecordId),
  sentAt: Schema.DateFromSelf,
  variant: UserInactivityNotificationVariant,
})
export type UpdateInactivityNotificationSentParams =
  typeof UpdateInactivityNotificationSentParams.Type

export const createUpdateInactivityNotificationSent = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateInactivityNotificationSentParams,
    execute: (params) => sql`
      UPDATE users
      SET
        last_inactivity_notification_sent_at = ${params.sentAt},
        number_of_inactivity_notifications_sent = ${params.variant === 'FIRST'
        ? sql`1`
        : // GREATEST covers users with no send history that jumped
          // straight to the follow-up wording - they continue with
          // the recurring cadence, not the one-week follow-up
          sql`GREATEST(number_of_inactivity_notifications_sent + 1, 2)`}
      WHERE
        ${sql.in('id', params.ids)}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateInactivityNotificationSent', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateInactivityNotificationSent query')
  )
})
