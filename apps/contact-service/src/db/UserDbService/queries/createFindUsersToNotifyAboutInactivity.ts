import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {UserRecordId} from '../domain'

export const FindUsersToNotifyAboutInactivityParams = Schema.Struct({
  firstNotificationBefore: Schema.Date,
  followUpDueBefore: Schema.Date,
  recurringDueBefore: Schema.Date,
})
export type FindUsersToNotifyAboutInactivityParams =
  typeof FindUsersToNotifyAboutInactivityParams.Type

export const UserToNotifyAboutInactivity = Schema.Struct({
  id: UserRecordId,
  expoToken: Schema.OptionFromOptionalNullOr(ExpoNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  vexlNotificationToken: Schema.OptionFromOptionalNullOr(
    VexlNotificationToken
  ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  refreshedAt: Schema.Date,
  numberOfInactivityNotificationsSent: Schema.Number,
})
export type UserToNotifyAboutInactivity =
  typeof UserToNotifyAboutInactivity.Type

export const createFindUsersToNotifyAboutInactivity = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

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
