import {
  MIN_GROUP_SIZE,
  type CountryFilter,
  type CountryOption,
} from '@/src/services/analytics/domain'
import {PgClient} from '@effect/sql-pg'
import {activityMonthlyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityMonthly'
import {getRegionCodeForCountryCode} from 'awesome-phonenumber'
import {Array, Effect, Schema} from 'effect'
import {rangeStartDay} from './buckets'
import {type QueryResult} from './query'

const LISTED_COUNTRIES = 6

/** Countries with the most monthly active installs over the kept 18 months. */
export const largestCountries: QueryResult<readonly string[]> = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql`
      SELECT
        country_prefix
      FROM
        analytics_states
      WHERE
        name = ${activityMonthlyAggregation.name}
        AND start_day >= ${rangeStartDay('all')}::date
        AND country_prefix <> 'none'
      GROUP BY
        country_prefix
      HAVING
        count(*) >= ${MIN_GROUP_SIZE}
      ORDER BY
        count(*) DESC
      LIMIT
        ${LISTED_COUNTRIES}
    `)
    const decoded = yield* _(
      Schema.decodeUnknown(
        Schema.Array(Schema.Struct({countryPrefix: Schema.String}))
      )(rows)
    )
    return Array.map(decoded, (row) => row.countryPrefix)
  }
)

const regionNames = new Intl.DisplayNames(['en'], {type: 'region'})

export const countryLabel = (country: CountryFilter): string => {
  if (country === 'all') return 'All countries'
  if (country === 'other') return 'Other (small countries)'
  const region = getRegionCodeForCountryCode(Number(country))
  return region === 'ZZ'
    ? `+${country}`
    : `+${country} ${regionNames.of(region) ?? region}`
}

export const countryOptions = (
  largest: readonly string[]
): readonly CountryOption[] =>
  Array.map(['all', ...largest, 'other'], (value) => ({
    value,
    label: countryLabel(value),
  }))
