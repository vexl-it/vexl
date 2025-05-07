import {SqlClient} from '@effect/sql'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {shouldDisableMetrics} from '@vexl-next/server-utils/src/commonConfigs'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {Effect, Layer} from 'effect'
import {inactivityNotificationAfterDaysConfig} from './configs'

const CONT_OF_UNIQUE_USERS = 'COUNT_OF_UNIQUE_USERS' as const
const COUNT_OF_UNIQUE_CONTACTS = 'COUNT_OF_UNIQUE_CONTACTS' as const
const COUNT_OF_CONNECTIONS = 'COUNT_OF_CONNECTIONS' as const
const USER_REFRESH = 'USER_REFRESH' as const

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

export const reportUserRefresh = (): Effect.Effect<
  void,
  never,
  MetricsClientService
> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: USER_REFRESH,
    })
  )

export const reportClubReported = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: CLUB_REPORTED,
    })
  )

export const reportClubDeactivated = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: CLUB_DEACTIVATED,
    })
  )

export const reportUserJoinedClubAndImportedContacts = ({
  clubUUid,
  contactsImported,
  value,
}: {
  clubUUid: ClubUuid
  contactsImported: boolean
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: USER_JOINED_CLUB_AND_IMPORTED_CONTACTS,
      attributes: {clubUUid, contactsImported},
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

export const queryAndReportNumberOfInnactiveUsers = Effect.gen(function* (_) {
  const inactivityNotificationAfterDays = yield* _(
    inactivityNotificationAfterDaysConfig
  )
  const sql = yield* _(SqlClient.SqlClient)
  return sql`
    SELECT
      count(*)
    FROM
      users
    WHERE
      refreshed_at IS NULL
      OR refreshed_at < now() - interval '${inactivityNotificationAfterDays} day'
  `.pipe(
    Effect.map((one) => Number(one[0].count)),
    Effect.flatMap((v) =>
      Effect.zipRight(
        Effect.logInfo(`Reporting number of innactive users: ${v}`),
        reportCountOfUniqueContacts(v)
      )
    ),
    Effect.withSpan('Query number of inactive users')
  )
})
