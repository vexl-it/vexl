import {SqlClient} from '@effect/sql'
import {OfferStatsResponse} from '@vexl-next/rest-api/src/services/offer/offerStats'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const activeOfferStats = Schema.decodeUnknownSync(OfferStatsResponse)([
  {countryPrefix: 420, count: 2},
  {countryPrefix: 421, count: 1},
])

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`
        INSERT INTO
          offer_public (
            admin_id,
            offer_id,
            created_at,
            modified_at,
            report,
            refreshed_at,
            country_prefix
          )
        VALUES
          ('a1', 'active-420-1', now(), now(), 0, now(), 420),
          ('a2', 'active-420-2', now(), now(), 0, now(), 420),
          ('a3', 'active-421', now(), now(), 0, now(), 421),
          (
            'a4',
            'expired-420',
            now(),
            now(),
            0,
            now() - interval '30 days',
            420
          ),
          ('a5', 'flagged-420', now(), now(), 1, now(), 420),
          ('a6', 'no-prefix', now(), now(), 0, now(), NULL)
      `)
    })
  )
})

describe('Get offer stats', () => {
  it('counts only visible offers per country prefix and caches the result', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        expect(yield* _(client.getOfferStats())).toEqual(activeOfferStats)

        yield* _(sql`
          INSERT INTO
            offer_public (
              admin_id,
              offer_id,
              created_at,
              modified_at,
              report,
              refreshed_at,
              country_prefix
            )
          VALUES
            ('a7', 'active-421-2', now(), now(), 0, now(), 421)
        `)

        expect(yield* _(client.getOfferStats())).toEqual(activeOfferStats)
      })
    )
  })
})
