import {SqlClient} from '@effect/sql'
import {Effect, Layer, Metric} from 'effect'

export const countactsCountUniqueUsersGauge = Metric.gauge(
  'analytics.contacts.count_unique_users2',
  {
    description: 'Number of unique users',
  }
)

export const uniqueContactsGauge = Metric.gauge(
  'analytics.contacts.count_unique_contacts_2',
  {
    description: 'Number of unique contacts',
  }
)

export const countOfConnectionsGauge = Metric.gauge(
  'analytics.contacts.count_of_connections',
  {
    description: 'Total number of connections',
  }
)

export const userRefreshCounter = Metric.counter(
  'analytics.contacts.user_refresh',
  {
    description: 'Increments when user calls /refresh endpoint',
  }
)

export const reportGaguesLayer = Layer.effectDiscard(
  Effect.gen(function* (_) {
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
          Metric.set(countactsCountUniqueUsersGauge, v)
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
          Metric.set(uniqueContactsGauge, v)
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
          Metric.set(countOfConnectionsGauge, v)
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
