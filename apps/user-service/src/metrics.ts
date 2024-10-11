import {SqlClient} from '@effect/sql'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {Effect, Layer} from 'effect'

const USER_LOGGED_IN = 'USER_LOGGED_IN' as const
const NUMBER_OF_USERS = 'NUMBER_OF_USERS' as const

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
  numberOfUsers: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: NUMBER_OF_USERS,
      value: numberOfUsers,
      type: 'Total',
    })
  )

export const reportMetricsLayer = Layer.effectDiscard(
  Effect.gen(function* (_) {
    const sql = yield* _(SqlClient.SqlClient)

    const queryNumberOfUsers = sql`
      SELECT
        count(*) AS COUNT
      FROM
        users
    `.pipe(
      Effect.map((one) => Number(one[0].count)),
      Effect.flatMap((v) =>
        Effect.zipRight(
          Effect.logInfo(`Reporting number of logged users ${v}`),
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
