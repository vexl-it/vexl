import {SqlClient} from '@effect/sql'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Effect, Layer, Metric} from 'effect'

export const makeUserLoggedInCounter = (
  countryPrefix: CountryPrefix
): Metric.Metric.Counter<number> => {
  return Metric.counter('analytics.users.user_logged_in', {
    description: 'How many users logged in',
  }).pipe(Metric.tagged('countryPrefix', String(countryPrefix)))
}

export const numberOfUsersGauge = Metric.gauge(
  'analytics.users.number_of_users',
  {description: 'Number of users'}
)

export const reportGaugesLayer = Layer.effectDiscard(
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
          Metric.set(numberOfUsersGauge, v)
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
