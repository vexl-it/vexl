import {SqlClient, SqlSchema} from '@effect/sql'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {shouldDisableMetrics} from '@vexl-next/server-utils/src/commonConfigs'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {Array, Effect, Layer, Option, pipe, Schema} from 'effect'
import {expirationPeriodDaysConfig, offerReportFilterConfig} from './configs'

const OFFER_PUBLIC_PART_DELETED = 'OFFER_PUBLIC_PART_DELETED' as const
const OFFER_MODIFIED = 'OFFER_MODIFIED' as const
const OFFER_CREATED = 'OFFER_CREATED' as const
const OFFER_REPORTED = 'OFFER_REPORTED' as const
const TOTAL_BUY_OFFERS = 'TOTAL_BUY_OFFERS' as const
const TOTAL_BUY_OFFERS_ACROSS_ALL = 'TOTAL_BUY_OFFERS_ACROSS_ALL' as const
const TOTAL_SELL_OFFERS = 'TOTAL_SELL_OFFERS' as const
const TOTAL_SELL_OFFERS_ACROSS_ALL = 'TOTAL_SELL_OFFERS_ACROSS_ALL' as const
const TOTAL_OFFERS_ACROSS_ALL = 'TOTAL_OFFERS_ACROSS_ALL' as const
const TOTAL_SELL_OFFERS_EXPIRED = 'TOTAL_SELL_OFFERS_EXPIRED' as const
const TOTAL_SELL_OFFERS_EXPIRED_ACROSS_ALL =
  'TOTAL_SELL_OFFERS_EXPIRED_ACROSS_ALL' as const
const TOTAL_BUY_OFFERS_EXPIRED = 'TOTAL_BUY_OFFERS_EXPIRED' as const
const TOTAL_BUY_OFFERS_EXPIRED_ACROSS_ALL =
  'TOTAL_BUY_OFFERS_EXPIRED_ACROSS_ALL' as const
const TOTAL_OFFERS_EXPIRED_ACROSS_ALL =
  'TOTAL_OFFERS_EXPIRED_ACROSS_ALL' as const

const TOTAL_OFFERS_FLAGGED_ACROSS_ALL =
  'TOTAL_OFFERS_FLAGGED_ACROSS_ALL' as const

const MEAN_OFFER_VISIBILITY_PER_COUNTRY =
  'MEAN_OFFER_VISIBILITY_PER_COUNTRY' as const
const MEDIAN_OFFER_VISIBILITY_PER_COUNTRY =
  'MEDIAN_OFFER_VISIBILITY_PER_COUNTRY' as const

export const reportOfferPublicPartDeleted = (): Effect.Effect<
  void,
  never,
  MetricsClientService
> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_PUBLIC_PART_DELETED,
    })
  )

export const reportOfferModified = (): Effect.Effect<
  void,
  never,
  MetricsClientService
> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_MODIFIED,
    })
  )

export const reportOfferCreated = (
  countryPrefix: CountryPrefix
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_CREATED,
      attributes: {countryPrefix},
    })
  )

export const reportOfferReported = (
  offerId: OfferId
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_REPORTED,
      attributes: {offerId},
    })
  )

export const reportClubOfferReported = (
  offerId: OfferId
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: OFFER_REPORTED,
      attributes: {offerId},
    })
  )

export const reportTotalBuyOffers = ({
  countryPrefix,
  value,
}: {
  countryPrefix?: CountryPrefix
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_BUY_OFFERS,
      attributes: {countryPrefix: countryPrefix ?? 'none'},
      value,
    })
  )

export const reportTotalSellOffers = ({
  countryPrefix,
  value,
}: {
  countryPrefix?: CountryPrefix
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_SELL_OFFERS,
      attributes: {countryPrefix: countryPrefix ?? 'none'},
      value,
    })
  )

export const reportTotalSellOffersAcrossAll = ({
  value,
}: {
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_SELL_OFFERS_ACROSS_ALL,
      value,
    })
  )

export const reportTotalBuyOffersAcrossAll = ({
  value,
}: {
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_BUY_OFFERS_ACROSS_ALL,
      value,
    })
  )

export const reportTotalOffersAcrossAll = ({
  value,
}: {
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_OFFERS_ACROSS_ALL,
      value,
    })
  )

export const reportTotalSellOffersExpired = ({
  countryPrefix,
  value,
}: {
  countryPrefix?: CountryPrefix
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_SELL_OFFERS_EXPIRED,
      attributes: {countryPrefix: countryPrefix ?? 'none'},
      value,
    })
  )

export const reportTotalBuyOffersExpired = ({
  countryPrefix,
  value,
}: {
  countryPrefix?: CountryPrefix
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_BUY_OFFERS_EXPIRED,
      attributes: {countryPrefix: countryPrefix ?? 'none'},
      value,
    })
  )

export const reportTotalSellOffersExpiredAcrossAll = ({
  value,
}: {
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_SELL_OFFERS_EXPIRED_ACROSS_ALL,
      value,
    })
  )

export const reportTotalBuyOffersExpiredAcrossAll = ({
  value,
}: {
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_BUY_OFFERS_EXPIRED_ACROSS_ALL,
      value,
    })
  )

export const reportTotalOffersExpiredAcrossAll = ({
  value,
}: {
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_OFFERS_EXPIRED_ACROSS_ALL,
      value,
    })
  )

export const reportTotalOffersFlaggedAcrossAll = ({
  value,
}: {
  value: number
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TOTAL_OFFERS_FLAGGED_ACROSS_ALL,
      value,
    })
  )

const OffersStatsQueryResult = Schema.Struct({
  countryPrefix: Schema.Union(CountryPrefix, Schema.Null),
  buy: Schema.Int,
  sell: Schema.Int,
})

const reportMeanOfferVisibilityPerCountry = ({
  value,
  countryPrefix,
}: {
  value: number
  countryPrefix: CountryPrefix
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: MEAN_OFFER_VISIBILITY_PER_COUNTRY,
      value,
      attributes: {countryPrefix},
    })
  )

const reportMedianOfferVisibilityPerCountry = ({
  value,
  countryPrefix,
}: {
  value: number
  countryPrefix: CountryPrefix
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: MEDIAN_OFFER_VISIBILITY_PER_COUNTRY,
      value,
      attributes: {countryPrefix},
    })
  )

const queryOffersStats = SqlClient.SqlClient.pipe(
  Effect.flatMap((sql) =>
    SqlSchema.findAll({
      Request: Schema.Null,
      Result: OffersStatsQueryResult,
      execute: () => sql`
        SELECT
          country_prefix,
          COUNT(
            CASE
              WHEN offer_public.offer_type = 'BUY' THEN 1
            END
          )::int AS buy,
          COUNT(
            CASE
              WHEN offer_public.offer_type = 'SELL' THEN 1
            END
          )::int AS sell
        FROM
          offer_public
        WHERE
          refreshed_at >= now() - interval '30 day'
        GROUP BY
          country_prefix;
      `,
    })(null)
  )
)

const queryExpiredOffersStats = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)

  const result = yield* _(
    SqlSchema.findAll({
      Request: Schema.Null,
      Result: OffersStatsQueryResult,
      execute: () => sql`
        SELECT
          country_prefix,
          COUNT(
            CASE
              WHEN offer_public.offer_type = 'BUY' THEN 1
            END
          )::int AS buy,
          COUNT(
            CASE
              WHEN offer_public.offer_type = 'SELL' THEN 1
            END
          )::int AS sell
        FROM
          offer_public
        WHERE
          refreshed_at < now() - interval '1 day' * ${expirationPeriodDays}
        GROUP BY
          country_prefix;
      `,
    })(null)
  )
  return result
})

const QueryTotalOffersFlagged = Schema.Struct({
  flagged: Schema.NumberFromString,
})

const queryTotalOffersFlagged = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)
  const offerReportFilter = yield* _(offerReportFilterConfig)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)

  const result = yield* _(
    SqlSchema.findOne({
      Request: Schema.Null,
      Result: QueryTotalOffersFlagged,
      execute: () => sql`
        SELECT
          COUNT(*) AS flagged
        FROM
          offer_public
        WHERE
          report >= ${offerReportFilter}
          AND refreshed_at >= (
            now() - interval '1 DAY' * ${expirationPeriodDays}
          )::date
      `,
    })(null)
  )
  return pipe(
    result,
    Option.map((one) => one.flagged),
    Option.getOrElse(() => 0)
  )
})

const OfferVisibilityPerCountryQueryResult = Schema.Struct({
  countryPrefix: CountryPrefix,
  value: Schema.Number,
})

const queryMeanOfferVisibilityPerCountry = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const result = yield* _(
    SqlSchema.findAll({
      Request: Schema.Null,
      Result: OfferVisibilityPerCountryQueryResult,
      execute: () => sql`
        SELECT
          country_prefix,
          round(AVG(offer_count))::Integer AS value
        FROM
          (
            SELECT
              op.country_prefix,
              COUNT(op.offer_id) AS offer_count
            FROM
              offer_private
              LEFT JOIN offer_public op ON offer_private.offer_id = op.id
            WHERE
              op.country_prefix IS NOT NULL
              AND op.refreshed_at >= (
                now() - interval '1 DAY' * ${expirationPeriodDays}
              )::date
              AND op.report < ${offerReportFilter}
            GROUP BY
              op.offer_id,
              op.country_prefix
          ) subquery
        GROUP BY
          country_prefix
      `,
    })(null)
  )
  return result
})

const queryMedianOfferVisibilityPerCountry = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const result = yield* _(
    SqlSchema.findAll({
      Request: Schema.Null,
      Result: OfferVisibilityPerCountryQueryResult,
      execute: () => sql`
        SELECT
          country_prefix,
          round(
            PERCENTILE_CONT(0.5) WITHIN GROUP (
              ORDER BY
                offer_count
            )
          )::Integer AS value
        FROM
          (
            SELECT
              op.country_prefix,
              COUNT(op.offer_id) AS offer_count
            FROM
              public.offer_private
              LEFT JOIN offer_public op ON offer_private.offer_id = op.id
            WHERE
              op.country_prefix IS NOT NULL
              AND op.refreshed_at >= (
                now() - interval '1 DAY' * ${expirationPeriodDays}
              )::date
              AND op.report < ${offerReportFilter}
            GROUP BY
              op.offer_id,
              op.country_prefix
          ) subquery
        GROUP BY
          country_prefix
      `,
    })(null)
  )
  return result
})

export const reportMetricsLayer = Layer.effectDiscard(
  Effect.gen(function* (_) {
    if (yield* _(shouldDisableMetrics)) {
      return
    }

    const queryAndReportOffers = queryOffersStats.pipe(
      Effect.flatMap((listOfCountries) =>
        pipe(
          Array.map(listOfCountries, (one) => [
            reportTotalBuyOffers({
              countryPrefix: one.countryPrefix ?? undefined,
              value: one.buy,
            }),
            reportTotalSellOffers({
              countryPrefix: one.countryPrefix ?? undefined,
              value: one.sell,
            }),
          ]),
          Array.flatten,
          Array.appendAll([
            // Sum of all buy
            pipe(
              listOfCountries,
              Array.map((one) => one.buy),
              Array.reduce(0, (a, b) => a + b),
              (v) => reportTotalBuyOffersAcrossAll({value: v})
            ),
            // Sum of all sell
            pipe(
              listOfCountries,
              Array.map((one) => one.sell),
              Array.reduce(0, (a, b) => a + b),
              (v) => reportTotalSellOffersAcrossAll({value: v})
            ),
            // Sum of all
            pipe(
              listOfCountries,
              Array.map((one) => one.sell + one.buy),
              Array.reduce(0, (a, b) => a + b),
              (v) => reportTotalOffersAcrossAll({value: v})
            ),
          ]),
          Effect.all
        )
      ),
      Effect.withSpan('QueryAndReportNumberOfOffers')
    )

    const queryAndReportExpiredOffers = queryExpiredOffersStats.pipe(
      Effect.flatMap((listOfCountries) =>
        pipe(
          listOfCountries,
          Array.map((one) => [
            reportTotalBuyOffersExpired({
              countryPrefix: one.countryPrefix ?? undefined,
              value: one.buy,
            }),
            reportTotalSellOffersExpired({
              countryPrefix: one.countryPrefix ?? undefined,
              value: one.sell,
            }),
          ]),
          Array.flatten,
          Array.appendAll([
            // Sum of all buy
            pipe(
              listOfCountries,
              Array.map((one) => one.buy),
              Array.reduce(0, (a, b) => a + b),
              (v) => reportTotalBuyOffersExpiredAcrossAll({value: v})
            ),
            // Sum of all sell
            pipe(
              listOfCountries,
              Array.map((one) => one.sell),
              Array.reduce(0, (a, b) => a + b),
              (v) => reportTotalSellOffersExpiredAcrossAll({value: v})
            ),
            // Sum of all
            pipe(
              listOfCountries,
              Array.map((one) => one.sell + one.buy),
              Array.reduce(0, (a, b) => a + b),
              (v) => reportTotalOffersExpiredAcrossAll({value: v})
            ),
          ]),
          Effect.all
        )
      ),
      Effect.withSpan('QueryAndReportNumberOfExpiredOffers')
    )

    const queryAndReportOfferVisibility = Effect.all([
      queryMeanOfferVisibilityPerCountry.pipe(
        Effect.flatMap((listOfCountries) =>
          pipe(
            listOfCountries,
            Array.map((one) =>
              reportMeanOfferVisibilityPerCountry({
                countryPrefix: one.countryPrefix,
                value: one.value,
              })
            ),
            Effect.all
          )
        )
      ),
      queryMedianOfferVisibilityPerCountry.pipe(
        Effect.flatMap((listOfCountries) =>
          pipe(
            listOfCountries,
            Array.map((one) =>
              reportMedianOfferVisibilityPerCountry({
                countryPrefix: one.countryPrefix,
                value: one.value,
              })
            ),
            Effect.all
          )
        )
      ),
    ]).pipe(Effect.withSpan('queryAndReportOfferVisibility'))

    const queryAndReportTotalOffersFlagged = queryTotalOffersFlagged.pipe(
      Effect.flatMap((v) => reportTotalOffersFlaggedAcrossAll({value: v})),
      Effect.withSpan('queryAndReportTotalOffersFlagged')
    )

    yield* _(
      Effect.zip(
        Effect.logInfo('Reporting metrics'),
        Effect.all([
          queryAndReportOffers,
          queryAndReportExpiredOffers,
          queryAndReportOfferVisibility,
          queryAndReportTotalOffersFlagged,
        ])
      ),
      Effect.tapError((e) => Effect.logError(`Error reporting metrics`, e)),
      Effect.tap(() => Effect.logInfo('Metrics reported')),
      Effect.flatMap(() => Effect.sleep('10 minutes')),
      Effect.forever,
      Effect.withSpan('Report metrics'),
      Effect.fork
    )
  })
)
