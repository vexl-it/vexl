import {SqlClient, SqlSchema} from '@effect/sql'
import {
  CountryPrefixE,
  type CountryPrefix,
} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {Array, Effect, Layer, pipe, Schema} from 'effect'
import {type ReadonlyArray} from 'effect/Array'

const USER_LOGGED_IN = 'USER_LOGGED_IN' as const
const NUMBER_OF_USERS = 'NUMBER_OF_USERS_BY_COUNTRY' as const
const NUMBER_OF_USERS_ALL_COUNTRIES = 'NUMBER_OF_USERS' as const

export const reportUserLoggedIn = (
  countryPrefix: CountryPrefix
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: USER_LOGGED_IN,
      attributes: {countryPrefix},
    })
  )

export const reportTotalNumberOfUsers = (
  dataToReport: ReadonlyArray<{count: number; countryPrefix: CountryPrefix}>
): Effect.Effect<void, never, MetricsClientService> =>
  Effect.gen(function* (_) {
    yield* _(
      dataToReport,
      Array.map((data) =>
        reportMetricForked(
          new MetricsMessage({
            uuid: generateUuid(),
            timestamp: new Date(),
            name: NUMBER_OF_USERS,
            value: data.count,
            attributes: {countryPrefix: data.countryPrefix},
            type: 'Total',
          })
        )
      ),
      Effect.all
    )

    const totalNumberOfUsers = pipe(
      dataToReport,
      Array.map((data) => data.count),
      Array.reduce(0, (acc, v) => acc + v)
    )
    yield* _(
      reportMetricForked(
        new MetricsMessage({
          uuid: generateUuid(),
          timestamp: new Date(),
          name: NUMBER_OF_USERS_ALL_COUNTRIES,
          value: totalNumberOfUsers,
          type: 'Total',
        })
      )
    )
  })

export const reportMetricsLayer = Layer.effectDiscard(
  Effect.gen(function* (_) {
    const sql = yield* _(SqlClient.SqlClient)

    const queryNumberOfUsers = SqlSchema.findAll({
      Request: Schema.Null,
      Result: Schema.Struct({
        count: Schema.NumberFromString,
        countryPrefix: CountryPrefixE,
      }),
      execute: () => sql`
        SELECT
          count(*) AS "count",
          country_prefix AS "countryPrefix"
        FROM
          users
        GROUP BY
          country_prefix
      `,
    })(null).pipe(
      Effect.flatMap((v) =>
        Effect.zipRight(
          Effect.logInfo(`Reporting number of logged users`, v),
          reportTotalNumberOfUsers(v)
        )
      ),
      Effect.withSpan('Query number of users')
    )

    yield* _(
      Effect.zip(Effect.logInfo('Reporting metrics'), queryNumberOfUsers),
      Effect.tapError((e) => Effect.logError(`Error reporting metrics`, e)),
      Effect.tap(() => Effect.logInfo('Metrics reported')),
      Effect.flatMap(() => Effect.sleep(60_000)),
      Effect.forever,
      Effect.withSpan('Report metrics'),
      Effect.fork
    )
  })
)
