import {
  MarketplaceOpenedBucket,
  type MarketplaceCountry,
  type MarketplaceWeek,
} from '@/src/services/analytics/domain'
import {OffersVisibleBucket} from '@vexl-next/analytics-definitions/src/buckets'
import {type DayString} from '@vexl-next/analytics-definitions/src/core'
import {
  FirstLoadResult,
  marketplaceWeeklyAggregation,
  type MarketplaceWeeklyState,
} from '@vexl-next/analytics-definitions/src/definitions/marketplaceWeekly'
import {
  Array,
  Effect,
  Order,
  pipe,
  Record,
  Schema,
  type ParseResult,
} from 'effect'
import {
  buildWeeklyReport,
  isWeekProvisional,
  suppressCounts,
  type WeekValues,
} from './rules'
import {
  instancesOf,
  payloadValueCounts,
  selectWeeklyValueCounts,
  toValueCounts,
  type WeeklyValueCountRow,
} from './weeklyValueCounts'

const OTHER_COUNTRIES = 'other'

const decodeMarketplaceOpened = Schema.decodeUnknown(
  Schema.compose(
    Schema.NumberFromString,
    marketplaceWeeklyAggregation.payloadSchema.fields.marketplaceOpened
  )
)

const bucketMarketplaceOpened = (count: number): MarketplaceOpenedBucket => {
  if (count <= 1) return count === 0 ? '0' : '1'
  if (count <= 5) return '2to5'
  if (count <= 20) return '6to20'
  return '21plus'
}

const marketplaceOpenedCounts = (
  counts: Readonly<Record<string, number>>
): Effect.Effect<Record<string, number>, ParseResult.ParseError> =>
  pipe(
    Record.toEntries(counts),
    Effect.forEach(([value, count]) =>
      Effect.map(decodeMarketplaceOpened(value), (opened) => ({
        bucket: bucketMarketplaceOpened(opened),
        count,
      }))
    ),
    Effect.map(
      Array.reduce({}, (acc: Record<string, number>, {bucket, count}) => ({
        ...acc,
        [bucket]: (acc[bucket] ?? 0) + count,
      }))
    )
  )

const buildMarketplaceWeek =
  (minGroupSize: number, today: DayString) => (week: WeekValues) =>
    Effect.all({
      weekStart: Effect.succeed(week.weekStart),
      provisional: Effect.succeed(
        isWeekProvisional(marketplaceWeeklyAggregation, week.weekStart, today)
      ),
      instances: Effect.succeed(week.instances),
      firstLoadResult: suppressCounts(
        FirstLoadResult,
        payloadValueCounts<MarketplaceWeeklyState>(
          week.values,
          'firstLoadResult'
        ),
        minGroupSize
      ),
      offersVisibleBucket: suppressCounts(
        OffersVisibleBucket,
        payloadValueCounts<MarketplaceWeeklyState>(
          week.values,
          'offersVisibleBucket'
        ),
        minGroupSize
      ),
      marketplaceOpened: pipe(
        marketplaceOpenedCounts(
          payloadValueCounts<MarketplaceWeeklyState>(
            week.values,
            'marketplaceOpened'
          )
        ),
        Effect.flatMap((counts) =>
          suppressCounts(MarketplaceOpenedBucket, counts, minGroupSize)
        )
      ),
    }) satisfies Effect.Effect<MarketplaceWeek, unknown>

// Countries under the minimum group size in a week are pooled into `other`
// before any per-country suppression, so no small country is shown alone.
const poolSmallCountries = (
  rows: readonly WeeklyValueCountRow[],
  minGroupSize: number
): readonly WeeklyValueCountRow[] => {
  const instancesByWeekCountry = pipe(
    rows,
    Array.groupBy((row) => `${row.weekStart}|${row.countryPrefix}`),
    Record.map((groupRows) => instancesOf(toValueCounts(groupRows)))
  )
  return Array.map(rows, (row) =>
    (instancesByWeekCountry[`${row.weekStart}|${row.countryPrefix}`] ?? 0) <
    minGroupSize
      ? {...row, countryPrefix: OTHER_COUNTRIES}
      : row
  )
}

const totalInstances = (weeks: readonly MarketplaceWeek[]): number =>
  Array.reduce(weeks, 0, (sum, week) => sum + week.instances)

export const marketplaceWeekly = (minGroupSize: number, today: DayString) =>
  Effect.gen(function* (_) {
    const rows = yield* _(
      selectWeeklyValueCounts(marketplaceWeeklyAggregation.name)
    )
    const buildWeek = buildMarketplaceWeek(minGroupSize, today)

    const overall = yield* _(buildWeeklyReport(rows, minGroupSize, buildWeek))
    const countries = yield* _(
      pipe(
        poolSmallCountries(rows, minGroupSize),
        Array.groupBy((row) => row.countryPrefix),
        Record.toEntries,
        Effect.forEach(([countryPrefix, countryRows]) =>
          Effect.map(
            buildWeeklyReport(countryRows, minGroupSize, buildWeek),
            ({weeks}): MarketplaceCountry => ({countryPrefix, weeks})
          )
        )
      )
    )

    return {
      ...overall,
      countries: pipe(
        countries,
        Array.filter((country) => Array.isNonEmptyReadonlyArray(country.weeks)),
        Array.sort(
          Order.reverse(
            Order.mapInput(Order.number, (country: MarketplaceCountry) =>
              totalInstances(country.weeks)
            )
          )
        )
      ),
    }
  })
