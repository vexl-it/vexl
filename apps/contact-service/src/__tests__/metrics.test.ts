import {SqlClient} from '@effect/sql'
import {mockedReportMetric} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {Effect} from 'effect'
import {
  queryAndReportNumberOfActiveUsers,
  queryAndReportNumberOfInactiveUsers,
} from '../metrics'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

describe('Active and inactive user gauges', () => {
  it('Reports counts of active and inactive users', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM user_contact`)
        yield* _(sql`DELETE FROM users`)
        // Active window is 30 days (default), inactivity threshold is 2 days
        // (.env.test). pk1 and pk2 are active; pk2, pk3 and pk4 are inactive.
        yield* _(sql`
          INSERT INTO
            users (public_key, hash, refreshed_at, country_prefix)
          VALUES
            ('pk1', 'h1', CURRENT_DATE, 420),
            ('pk2', 'h2', CURRENT_DATE - 10, 420),
            ('pk3', 'h3', CURRENT_DATE - 40, 421),
            ('pk4', 'h4', NULL, NULL)
        `)

        mockedReportMetric.mockClear()
        yield* _(queryAndReportNumberOfActiveUsers)
        yield* _(queryAndReportNumberOfInactiveUsers)
        // reports are forked into the background
        yield* _(Effect.sleep(200))

        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'COUNT_OF_ACTIVE_USERS',
            value: 2,
            type: 'Total',
          })
        )
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'COUNT_OF_ACTIVE_USERS_BY_COUNTRY',
            value: 2,
            attributes: {countryPrefix: 420},
            type: 'Total',
          })
        )
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'COUNT_OF_INACTIVE_USERS',
            value: 3,
            type: 'Total',
          })
        )
        expect(mockedReportMetric).toHaveBeenCalledTimes(3)
      })
    )
  })
})
