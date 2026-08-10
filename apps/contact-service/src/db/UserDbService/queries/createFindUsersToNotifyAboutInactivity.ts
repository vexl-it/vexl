import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow, Schema} from 'effect'
import {UserRecordId} from '../domain'

export const FindUsersToNotifyAboutInactivityParams = Schema.Struct({
  firstNotificationBefore: Schema.DateFromSelf,
  followUpDueBefore: Schema.DateFromSelf,
  recurringDueBefore: Schema.DateFromSelf,
})
export type FindUsersToNotifyAboutInactivityParams =
  typeof FindUsersToNotifyAboutInactivityParams.Type

export const UserToNotifyAboutInactivity = Schema.Struct({
  id: UserRecordId,
  expoToken: Schema.optionalWith(ExpoNotificationToken, {
    as: 'Option',
    nullable: true,
  }),
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
    nullable: true,
  }),
  refreshedAt: Schema.DateFromSelf,
  numberOfInactivityNotificationsSent: Schema.Number,
})
export type UserToNotifyAboutInactivity =
  typeof UserToNotifyAboutInactivity.Type

export const createFindUsersToNotifyAboutInactivity = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: FindUsersToNotifyAboutInactivityParams,
    Result: UserToNotifyAboutInactivity,
    execute: (params) => sql`
      SELECT
        u.id,
        u.expo_token,
        u.vexl_notification_token,
        u.refreshed_at,
        u.number_of_inactivity_notifications_sent
      FROM
        users u
      WHERE
        u.refreshed_at IS NOT NULL
        AND u.refreshed_at < ${params.firstNotificationBefore}
        AND (
          u.expo_token IS NOT NULL
          OR u.vexl_notification_token IS NOT NULL
        )
        AND (
          u.number_of_inactivity_notifications_sent = 0
          OR (
            u.number_of_inactivity_notifications_sent = 1
            AND u.last_inactivity_notification_sent_at <= ${params.followUpDueBefore}
          )
          OR (
            u.number_of_inactivity_notifications_sent >= 2
            AND u.last_inactivity_notification_sent_at <= ${params.recurringDueBefore}
          )
        )
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors(
      'Error in findUsersToNotifyAboutInactivity'
    ),
    Effect.withSpan('findUsersToNotifyAboutInactivity query')
  )
})
