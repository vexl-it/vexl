import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferStats} from '@vexl-next/rest-api/src/services/offer/offerStats'
import {Effect, flow, Schema} from 'effect'
import {
  expirationPeriodDaysConfig,
  offerReportFilterConfig,
} from '../../../configs'
import {offerNotExpired, offerNotFlagged} from '../utils'

export const createQueryActiveOffersPerCountry = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const query = SqlSchema.findAll({
    Request: Schema.Void,
    Result: OfferStats,
    execute: () => sql`
      SELECT
        country_prefix,
        COUNT(*)::integer AS count
      FROM
        offer_public
      WHERE
        ${sql.and([
        sql`country_prefix IS NOT NULL`,
        offerNotExpired(sql, expirationPeriodDays),
        offerNotFlagged(sql, offerReportFilter),
      ])}
      GROUP BY
        country_prefix
      ORDER BY
        country_prefix
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error querying active offers per country')
  )
})
