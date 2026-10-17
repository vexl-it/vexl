import {
  formatValue,
  type CountryFilter,
  type LiquidityData,
  type SeriesPoint,
  type TableData,
} from '@/src/services/analytics/domain'
import {
  type DurationBucket,
  type OffersVisibleBucket,
} from '@vexl-next/analytics-definitions/src/buckets'
import {type RequestClass} from '@vexl-next/analytics-definitions/src/coreAction'
import {activityWeeklyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityWeekly'
import {
  offerJourney,
  type OfferState,
} from '@vexl-next/analytics-definitions/src/definitions/offer'
import {requestJourney} from '@vexl-next/analytics-definitions/src/definitions/request'
import {Array, Effect, Option, pipe} from 'effect'
import {
  bucketsOf,
  daysOf,
  lastFinalWeek,
  snapshotOf,
  type Bucket,
} from './buckets'
import {countryLabel} from './countries'
import {
  countStates,
  gaugeMetric,
  sumMetric,
  sumValues,
  sumWhere,
  type GaugeValue,
  type QueryResult,
  type QueryScope,
} from './query'
import {countOrNull, inBucket, percentOrNull, seriesOf, shareRow} from './stats'

const OFFERS_VISIBLE: readonly OffersVisibleBucket[] = [
  '0',
  '1to5',
  '6to20',
  '21to50',
  '51plus',
]

const REQUEST_CLASSES: ReadonlyArray<readonly [string, RequestClass]> = [
  ['Main marketplace', 'main'],
  ['Clubs', 'club'],
]

const RESPONSE_TIMES: ReadonlyArray<
  readonly [string, DurationBucket | undefined]
> = [
  ['< 1 hour', 'under1h'],
  ['1 hour – 1 day', '1hTo1d'],
  ['1–7 days', '1dTo7d'],
  ['> 7 days', 'over7d'],
  ['None within 14 days', undefined],
]

const FIRST_REQUEST_TIMES: readonly DurationBucket[] = [
  'under1h',
  '1hTo1d',
  '1dTo7d',
  'over7d',
]

const FIRST_REQUEST_GROUPS: ReadonlyArray<
  readonly [string, (state: Partial<OfferState>) => boolean]
> = [
  ['All', () => true],
  ['Main marketplace only', (state) => state.class === 'main'],
  ['Also shared to Clubs', (state) => state.class === 'mainAndClub'],
  ['Buy offers', (state) => state.offerType === 'buy'],
  ['Sell offers', (state) => state.offerType === 'sell'],
]

export const withCountry = (
  scope: QueryScope,
  country: CountryFilter
): QueryScope => ({...scope, filters: {...scope.filters, country}})

// Medians are per country, so all countries shows the largest markets and
// "other", which merges several countries, shows none
const medianCountriesOf = (scope: QueryScope): readonly string[] => {
  const {country} = scope.filters
  if (country === 'all') return Array.take(scope.largestCountries, 3)
  return country === 'other' ? [] : [country]
}

const countryKeys = (
  keys: readonly CountryFilter[]
): ReadonlyArray<{key: string; label: string}> =>
  Array.map(keys, (key) => ({key, label: countryLabel(key)}))

export const loadLiquidity = (scope: QueryScope): QueryResult<LiquidityData> =>
  Effect.gen(function* (_) {
    const {filters} = scope
    const backendBuckets = bucketsOf(filters, 'backend')
    const backendDays = daysOf(backendBuckets)
    const weekBuckets = bucketsOf(
      {period: 'week', range: filters.range},
      activityWeeklyAggregation
    )
    const lastWeek = lastFinalWeek(activityWeeklyAggregation)
    const outcomeBuckets = bucketsOf(filters, requestJourney)
    const offerSnapshot = snapshotOf(
      filters.range,
      'offers created',
      offerJourney.lifetimeDays
    )
    const requestSnapshot = snapshotOf(
      filters.range,
      'requests sent',
      requestJourney.lifetimeDays
    )
    const emptyCountries: readonly CountryFilter[] =
      filters.country === 'all'
        ? ['all', ...Array.take(scope.largestCountries, 3)]
        : [filters.country]
    const tableCountries: readonly CountryFilter[] = [
      ...scope.largestCountries,
      'other',
    ]
    const offersVisibleIn = (
      days: ReturnType<typeof daysOf>,
      country: CountryFilter
    ) =>
      countStates(activityWeeklyAggregation.name, {
        state: activityWeeklyAggregation.payloadSchema.pick('offersVisible'),
        days,
        period: 'week',
        scope: withCountry(scope, country),
      })

    const data = yield* _(
      Effect.all(
        {
          offers: gaugeMetric({
            names: ['TOTAL_BUY_OFFERS', 'TOTAL_SELL_OFFERS'],
            pick: 'last',
            days: backendDays,
            period: filters.period,
            country: 'countryPrefix',
            scope,
          }),
          medians: gaugeMetric({
            names: ['MEDIAN_OFFER_VISIBILITY_PER_COUNTRY'],
            pick: 'last',
            days: backendDays,
            period: filters.period,
            country: 'countryPrefix',
          }),
          created: sumMetric({
            name: 'OFFER_CREATED',
            by: 'offerType',
            days: backendDays,
            period: filters.period,
            dimensions: {country: 'countryPrefix', platform: 'appPlatform'},
            scope,
          }),
          requestsSent: sumMetric({
            name: 'REQUEST_SENT',
            days: backendDays,
            period: filters.period,
            dimensions: {
              country: 'clientCountryPrefix',
              platform: 'appPlatform',
            },
            scope,
          }),
          emptyRows: Effect.forEach(
            emptyCountries,
            (country) => offersVisibleIn(daysOf(weekBuckets), country),
            {concurrency: 'unbounded'}
          ),
          tableRows: Effect.forEach(
            tableCountries,
            (country) =>
              offersVisibleIn(
                Option.match(lastWeek, {
                  onNone: () => undefined,
                  onSome: (week) => daysOf([week]),
                }),
                country
              ),
            {concurrency: 'unbounded'}
          ),
          outcomeRows: countStates(requestJourney.name, {
            state: requestJourney.payloadSchema.pick('class', 'outcome'),
            days: daysOf(outcomeBuckets),
            period: filters.period,
            scope,
          }),
          responseRows: countStates(requestJourney.name, {
            state: requestJourney.payloadSchema.pick('class', 'answerAfter'),
            days: requestSnapshot.days,
            scope,
          }),
          offerRows: countStates(offerJourney.name, {
            state: offerJourney.payloadSchema.pick(
              'class',
              'offerType',
              'firstRequestAfter',
              'removed'
            ),
            days: offerSnapshot.days,
            scope,
          }),
        },
        {concurrency: 'unbounded'}
      )
    )

    const offersOf = (
      bucket: Bucket,
      predicate: (gauge: GaugeValue) => boolean
    ): number =>
      sumValues(
        data.offers,
        (gauge) => inBucket(bucket)(gauge) && predicate(gauge)
      )
    const activeOffers = seriesOf(backendBuckets, (bucket) => ({
      buy: countOrNull(
        offersOf(bucket, (gauge) => gauge.name === 'TOTAL_BUY_OFFERS')
      ),
      sell: countOrNull(
        offersOf(bucket, (gauge) => gauge.name === 'TOTAL_SELL_OFFERS')
      ),
    }))
    const activeOffersNow = pipe(
      backendBuckets,
      Array.findLast((bucket) => Array.some(data.offers, inBucket(bucket))),
      Option.map((bucket) => countOrNull(offersOf(bucket, () => true))),
      Option.getOrNull
    )

    const medianCountries = medianCountriesOf(scope)
    const medianPoints = seriesOf(backendBuckets, (bucket) =>
      Object.fromEntries(
        Array.map(medianCountries, (country) => [
          country,
          // A median over fewer offers than the minimum group is hidden
          countOrNull(offersOf(bucket, (gauge) => gauge.key === country)) ===
          null
            ? null
            : pipe(
                data.medians,
                Array.findFirst(
                  (gauge) => inBucket(bucket)(gauge) && gauge.key === country
                ),
                Option.map((gauge) => gauge.value),
                Option.getOrNull
              ),
        ])
      )
    )

    const emptyPoints = seriesOf(weekBuckets, (bucket) =>
      Object.fromEntries(
        Array.map(
          Array.zip(emptyCountries, data.emptyRows),
          ([country, rows]) => {
            const bucketRows = Array.filter(rows, inBucket(bucket))
            return [
              country,
              percentOrNull(
                sumWhere(bucketRows, (row) => row.state.offersVisible === '0'),
                sumWhere(
                  bucketRows,
                  (row) => row.state.offersVisible !== undefined
                )
              ),
            ]
          }
        )
      )
    )

    const visibleByCountry: TableData = {
      headers: [
        'Country',
        'Installs',
        '0 offers',
        '1–5',
        '6–20',
        '21–50',
        '51+',
      ],
      rows: Array.map(
        Array.zip(tableCountries, data.tableRows),
        ([country, rows]) => {
          const installs = sumWhere(
            rows,
            (row) => row.state.offersVisible !== undefined
          )
          return [
            countryLabel(country),
            formatValue.count(countOrNull(installs)),
            ...Array.map(OFFERS_VISIBLE, (bucket) =>
              formatValue.pct(
                percentOrNull(
                  sumWhere(rows, (row) => row.state.offersVisible === bucket),
                  installs
                )
              )
            ),
          ]
        }
      ),
    }

    const requestOutcomes = Array.map(
      REQUEST_CLASSES,
      ([label, requestClass]) => ({
        label,
        points: seriesOf(outcomeBuckets, (bucket) => {
          const rows = Array.filter(
            data.outcomeRows,
            (row) => inBucket(bucket)(row) && row.state.class === requestClass
          )
          const sent = sumWhere(rows, () => true)
          const withOutcome = (outcome: string | undefined): number | null =>
            percentOrNull(
              sumWhere(rows, (row) => row.state.outcome === outcome),
              sent
            )
          return {
            approved: withOutcome('approved'),
            rejected: withOutcome('rejected'),
            cancelled: withOutcome('cancelled'),
            noResponse: withOutcome(undefined),
          }
        }),
      })
    )

    const timeToResponse: readonly SeriesPoint[] = Array.map(
      RESPONSE_TIMES,
      ([label, answerAfter]) => ({
        label,
        provisional: false,
        values: Object.fromEntries(
          Array.map(REQUEST_CLASSES, ([, requestClass]) => {
            const rows = Array.filter(
              data.responseRows,
              (row) => row.state.class === requestClass
            )
            return [
              requestClass,
              percentOrNull(
                sumWhere(rows, (row) => row.state.answerAfter === answerAfter),
                sumWhere(rows, () => true)
              ),
            ]
          })
        ),
      })
    )

    // Offers deleted before any request say nothing about demand
    const offers = Array.filter(
      data.offerRows,
      (row) =>
        row.state.removed !== true || row.state.firstRequestAfter !== undefined
    )
    const timeToFirstRequest: TableData = {
      headers: [
        'Offers',
        'New offers',
        '< 1 hour',
        '1 hour – 1 day',
        '1–7 days',
        '> 7 days',
        'No request within 30 days',
      ],
      rows: Array.map(FIRST_REQUEST_GROUPS, ([label, predicate]) => {
        const rows = Array.filter(offers, (row) => predicate(row.state))
        return shareRow(
          label,
          sumWhere(rows, () => true),
          [
            ...Array.map(FIRST_REQUEST_TIMES, (bucket) =>
              sumWhere(rows, (row) => row.state.firstRequestAfter === bucket)
            ),
            sumWhere(rows, (row) => row.state.firstRequestAfter === undefined),
          ]
        )
      }),
    }

    return {
      activeOffersNow,
      lastSettledWeek: Option.match(lastWeek, {
        onNone: () => '',
        onSome: (week) => week.label,
      }),
      offersCreated: seriesOf(backendBuckets, (bucket) => ({
        buy: countOrNull(
          sumValues(
            data.created,
            (value) => inBucket(bucket)(value) && value.key === 'BUY'
          )
        ),
        sell: countOrNull(
          sumValues(
            data.created,
            (value) => inBucket(bucket)(value) && value.key === 'SELL'
          )
        ),
      })),
      emptyMarketplace: {
        countries: countryKeys(emptyCountries),
        points: emptyPoints,
      },
      offerCohorts: offerSnapshot.cohorts,
      requestCohorts: requestSnapshot.cohorts,
      activeOffers,
      visibleByCountry,
      requestOutcomes,
      requestsSent: seriesOf(backendBuckets, (bucket) => ({
        sent: countOrNull(sumValues(data.requestsSent, inBucket(bucket))),
      })),
      timeToFirstRequest,
      timeToResponse,
      medianVisibility: {
        countries: countryKeys(medianCountries),
        points: medianPoints,
      },
    }
  })
