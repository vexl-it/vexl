import {SqlClient, SqlSchema} from '@effect/sql'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type UserInactivityNotificationVariant} from '@vexl-next/domain/src/general/notifications'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {shouldDisableMetrics} from '@vexl-next/server-utils/src/commonConfigs'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {type CommonMetricAttributes} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {Array, Effect, Layer, pipe, Schema} from 'effect'
import {
  activeUserWindowDaysConfig,
  inactivityNotificationAfterDaysConfig,
} from './configs'

const CONT_OF_UNIQUE_USERS = 'COUNT_OF_UNIQUE_USERS' as const
const COUNT_OF_UNIQUE_CONTACTS = 'COUNT_OF_UNIQUE_CONTACTS' as const
const COUNT_OF_CONNECTIONS = 'COUNT_OF_CONNECTIONS' as const
const COUNT_OF_INACTIVE_USERS = 'COUNT_OF_INACTIVE_USERS' as const
const COUNT_OF_ACTIVE_USERS = 'COUNT_OF_ACTIVE_USERS' as const
const COUNT_OF_ACTIVE_USERS_BY_COUNTRY =
  'COUNT_OF_ACTIVE_USERS_BY_COUNTRY' as const
const COUNT_OF_INACTIVE_USERS_BY_REMINDERS_SENT =
  'COUNT_OF_INACTIVE_USERS_BY_REMINDERS_SENT' as const
const INACTIVITY_NOTIFICATION_SENT = 'INACTIVITY_NOTIFICATION_SENT' as const
const USER_LOGGED_IN = 'USER_LOGGED_IN' as const
const USER_REFRESH = 'USER_REFRESH' as const
const USER_REACTIVATED = 'USER_REACTIVATED' as const
const NEW_APP_USER_NOTIFICATIONS_SENT =
  'NEW_APP_USER_NOTIFICATIONS_SENT' as const

const CLUB_REPORTED = 'CLUB_REPORTED' as const
const CLUB_DEACTIVATED = 'CLUB_DEACTIVATED' as const
const USER_JOINED_CLUB_AND_IMPORTED_CONTACTS =
  'USER_JOINED_CLUB_AND_IMPORTED_CONTACTS' as const

export const reportCountOfUniqueUsers = (
  count: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: CONT_OF_UNIQUE_USERS,
      value: count,
      type: 'Total',
    })
  )

export const reportCountOfUniqueContacts = (
  count: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: COUNT_OF_UNIQUE_CONTACTS,
      value: count,
      type: 'Total',
    })
  )

export const reportCountOfConnections = (
  count: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: COUNT_OF_CONNECTIONS,
      value: count,
      type: 'Total',
    })
  )

export const reportCountOfInactiveUsers = (
  count: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: COUNT_OF_INACTIVE_USERS,
      value: count,
      type: 'Total',
    })
  )

export const reportCountOfActiveUsers = (
  count: number,
  timestamp: Date = new Date()
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp,
      name: COUNT_OF_ACTIVE_USERS,
      value: count,
      type: 'Total',
    })
  )

export const reportCountOfActiveUsersByCountry = ({
  count,
  countryPrefix,
  timestamp,
}: {
  count: number
  countryPrefix: CountryPrefix | 'none'
  timestamp: Date
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp,
      name: COUNT_OF_ACTIVE_USERS_BY_COUNTRY,
      value: count,
      attributes: {countryPrefix},
      type: 'Total',
    })
  )

export const reportUserLoggedIn = ({
  countryPrefix,
  numberExists,
  commonMetricAttributes,
}: {
  countryPrefix: CountryPrefix | 'none'
  numberExists: boolean
  commonMetricAttributes: CommonMetricAttributes
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: USER_LOGGED_IN,
      attributes: {...commonMetricAttributes, countryPrefix, numberExists},
    })
  )

export const reportUserRefresh = (
  attributes: CommonMetricAttributes
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: USER_REFRESH,
      attributes,
    })
  )

export const reportUserReactivated = ({
  commonMetricAttributes,
  daysInactive,
  remindersReceived,
  daysSinceLastReminder,
}: {
  commonMetricAttributes: CommonMetricAttributes
  daysInactive: number
  remindersReceived: number
  daysSinceLastReminder: number | 'none'
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: USER_REACTIVATED,
      attributes: {
        ...commonMetricAttributes,
        daysInactive,
        remindersReceived,
        daysSinceLastReminder,
      },
    })
  )

export const reportInactivityNotificationsSent = ({
  count,
  variant,
  notificationOrdinal,
}: {
  count: number
  variant: UserInactivityNotificationVariant
  notificationOrdinal: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: INACTIVITY_NOTIFICATION_SENT,
      value: count,
      type: 'Increment',
      attributes: {variant, notificationOrdinal},
    })
  )

const reportCountOfInactiveUsersByRemindersSent = ({
  count,
  remindersSent,
  timestamp,
}: {
  count: number
  remindersSent: number
  timestamp: Date
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp,
      name: COUNT_OF_INACTIVE_USERS_BY_REMINDERS_SENT,
      value: count,
      type: 'Total',
      attributes: {remindersSent},
    })
  )

export const reportNewAppUser = (
  count: number,
  trackingId: NotificationTrackingId
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      value: count,
      type: 'Increment',
      uuid: generateUuid(),
      timestamp: new Date(),
      attributes: {trackingId, metricVersion: 3},
      name: NEW_APP_USER_NOTIFICATIONS_SENT,
    })
  )

export const reportClubReported = (
  number: number,
  attributes: CommonMetricAttributes
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: CLUB_REPORTED,
      attributes,
    })
  )

export const reportClubDeactivated = (
  number: number,
  attributes: CommonMetricAttributes
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: CLUB_DEACTIVATED,
      attributes,
    })
  )

export const reportUserJoinedClubAndImportedContacts = ({
  clubUUid,
  contactsImported,
  value,
  commonMetricAttributes,
}: {
  clubUUid: ClubUuid
  contactsImported: boolean
  value: number
  commonMetricAttributes: CommonMetricAttributes
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: USER_JOINED_CLUB_AND_IMPORTED_CONTACTS,
      attributes: {...commonMetricAttributes, clubUUid, contactsImported},
      value,
    })
  )

export const reportGaguesLayer = Layer.effectDiscard(
  Effect.gen(function* (_) {
    if (yield* _(shouldDisableMetrics)) {
      return
    }
    const sql = yield* _(SqlClient.SqlClient)

    const queryNumberOfUniqueUsersEffect = sql`
      SELECT
        count(a) AS COUNT
      FROM
        (
          SELECT
            count(uc.hash_from) AS val
          FROM
            user_contact uc
          GROUP BY
            uc.hash_from
        ) AS a
    `.pipe(
      Effect.map((one) => Number(one[0].count)),
      Effect.flatMap((v) =>
        Effect.zipRight(
          Effect.logInfo(`Reporting number of unique users: ${v}`),
          reportCountOfUniqueUsers(v)
        )
      ),
      Effect.withSpan('Query number of unique users')
    )

    const queryNumberOfUniqueContactsEffect = sql`
      SELECT
        count(*) AS COUNT
      FROM
        (
          SELECT
            uc.hash_to
          FROM
            user_contact uc
          GROUP BY
            uc.hash_to
        ) a
    `.pipe(
      Effect.map((one) => Number(one[0].count)),
      Effect.flatMap((v) =>
        Effect.zipRight(
          Effect.logInfo(`Reporting number of unique contacts: ${v}`),
          reportCountOfUniqueContacts(v)
        )
      ),
      Effect.withSpan('Query number of unique contacts')
    )

    const queryNumberOfConnectionsEffect = sql`
      SELECT
        count(uc)
      FROM
        user_contact uc
    `.pipe(
      Effect.map((one) => Number(one[0].count)),
      Effect.flatMap((v) =>
        Effect.zipRight(
          Effect.logInfo(`Reporting number of connections: ${v}`),
          reportCountOfConnections(v)
        )
      ),
      Effect.withSpan('Query number of connections')
    )

    yield* _(Effect.logInfo('Starting to report metrics'))

    yield* _(
      Effect.zip(
        Effect.logInfo('Reporting metrics'),
        Effect.all(
          [
            queryNumberOfUniqueUsersEffect,
            queryNumberOfUniqueContactsEffect,
            queryNumberOfConnectionsEffect,
          ],
          {concurrency: 'unbounded'}
        )
      ),
      Effect.tapError((e) =>
        Effect.logError('Error while reporting metrics', e)
      ),
      Effect.flatMap(() => Effect.logInfo('Metrics reported')),
      Effect.flatMap(() => Effect.sleep(60_000)),
      Effect.forever,
      Effect.withSpan('Report gauges'),
      Effect.fork
    )
  })
)

export const queryAndReportNumberOfInactiveUsers = Effect.gen(function* (_) {
  const inactivityNotificationAfterDays = yield* _(
    inactivityNotificationAfterDaysConfig
  )
  const sql = yield* _(SqlClient.SqlClient)
  yield* _(
    sql`
      SELECT
        count(*)
      FROM
        users
      WHERE
        refreshed_at IS NULL
        OR refreshed_at < now() - interval '1 day' * ${inactivityNotificationAfterDays}
    `,
    Effect.map((one) => Number(one[0].count)),
    Effect.flatMap((v) =>
      Effect.zipRight(
        Effect.logInfo(`Reporting number of inactive users: ${v}`),
        reportCountOfInactiveUsers(v)
      )
    ),
    Effect.tapError((e) =>
      Effect.logError('Error reporting number of inactive users', e)
    ),
    Effect.ignore,
    Effect.withSpan('Query number of inactive users')
  )
})

const InactiveUsersByRemindersSentQueryResult = Schema.Struct({
  count: Schema.NumberFromString,
  remindersSent: Schema.Number,
})

export const queryAndReportInactiveUsersByRemindersSent = Effect.gen(
  function* (_) {
    const inactivityNotificationAfterDays = yield* _(
      inactivityNotificationAfterDaysConfig
    )
    const sql = yield* _(SqlClient.SqlClient)

    const inactiveUsersByRemindersSent = yield* _(
      SqlSchema.findAll({
        Request: Schema.Null,
        Result: InactiveUsersByRemindersSentQueryResult,
        execute: () => sql`
          SELECT
            count(*) AS "count",
            number_of_inactivity_notifications_sent AS "remindersSent"
          FROM
            users
          WHERE
            refreshed_at IS NULL
            OR refreshed_at < now() - interval '1 day' * ${inactivityNotificationAfterDays}
          GROUP BY
            number_of_inactivity_notifications_sent
        `,
      })(null)
    )

    const snapshotTimestamp = new Date()
    yield* _(
      inactiveUsersByRemindersSent,
      Array.map(({count, remindersSent}) =>
        reportCountOfInactiveUsersByRemindersSent({
          count,
          remindersSent,
          timestamp: snapshotTimestamp,
        })
      ),
      Effect.all
    )
  }
).pipe(
  Effect.tapError((e) =>
    Effect.logError('Error reporting inactive users by reminders sent', e)
  ),
  Effect.ignore,
  Effect.withSpan('Query inactive users by reminders sent')
)

const ActiveUsersByCountryQueryResult = Schema.Struct({
  count: Schema.NumberFromString,
  countryPrefix: Schema.Union(CountryPrefix, Schema.Null),
})

export const queryAndReportNumberOfActiveUsers = Effect.gen(function* (_) {
  const activeUserWindowDays = yield* _(activeUserWindowDaysConfig)
  const sql = yield* _(SqlClient.SqlClient)

  const activeUsersByCountry = yield* _(
    SqlSchema.findAll({
      Request: Schema.Null,
      Result: ActiveUsersByCountryQueryResult,
      execute: () => sql`
        SELECT
          count(*) AS "count",
          country_prefix AS "countryPrefix"
        FROM
          users
        WHERE
          refreshed_at >= now() - interval '1 day' * ${activeUserWindowDays}
        GROUP BY
          country_prefix
      `,
    })(null)
  )

  const totalActiveUsers = pipe(
    activeUsersByCountry,
    Array.map(({count}) => count),
    Array.reduce(0, (sum, count) => sum + count)
  )
  const snapshotTimestamp = new Date()

  const reportEffects = pipe(
    activeUsersByCountry,
    Array.map(({count, countryPrefix}) =>
      reportCountOfActiveUsersByCountry({
        count,
        countryPrefix: countryPrefix ?? 'none',
        timestamp: snapshotTimestamp,
      })
    ),
    Array.prepend(reportCountOfActiveUsers(totalActiveUsers, snapshotTimestamp))
  )

  yield* _(
    Effect.all(reportEffects, {concurrency: 'unbounded'}),
    Effect.zipLeft(
      Effect.logInfo(`Reported ${totalActiveUsers} active users by country`)
    ),
    Effect.withSpan('Query number of active users')
  )
})
