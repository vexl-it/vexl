import {
  type AnalyticsFilters,
  type Period,
} from '@/src/services/analytics/domain'
import {PgClient} from '@effect/sql-pg'
import {type SqlError} from '@effect/sql/SqlError'
import {type Fragment} from '@effect/sql/Statement'
import {
  Array,
  Effect,
  pipe,
  Record,
  Schema,
  String,
  type ParseResult,
} from 'effect'
import {type DayRange} from './buckets'

// metrics-service writes `payload` and `attributes` through a client that
// turns JSON keys into snake_case, so that is how they are stored.
const storedKey = String.camelToSnake

// Countries sorted by size; everything else except `none` is "other"
export interface QueryScope {
  readonly filters: AnalyticsFilters
  readonly largestCountries: readonly string[]
}

export type QueryResult<A> = Effect.Effect<
  A,
  SqlError | ParseResult.ParseError,
  PgClient.PgClient
>

const PLATFORM_VALUE: Record<'ios' | 'android', string> = {
  ios: 'IOS',
  android: 'ANDROID',
}

const scopeConditions = (
  sql: PgClient.PgClient,
  {filters, largestCountries}: QueryScope,
  {country, platform}: {country?: Fragment; platform?: Fragment}
): Fragment[] => [
  ...(platform && filters.platform !== 'all'
    ? [sql`${platform} = ${PLATFORM_VALUE[filters.platform]}`]
    : []),
  ...(country && filters.country === 'other'
    ? [
        sql`${country} <> 'none'`,
        ...(Array.isNonEmptyReadonlyArray(largestCountries)
          ? [sql`${country} NOT IN ${sql.in(largestCountries)}`]
          : []),
      ]
    : []),
  ...(country && filters.country !== 'all' && filters.country !== 'other'
    ? [sql`${country} = ${filters.country}`]
    : []),
]

const bucketOf = (
  sql: PgClient.PgClient,
  column: Fragment,
  period: Period | undefined
): Fragment =>
  period === undefined
    ? sql`NULL::text`
    : sql`
        to_char(
          date_trunc(
            ${period},
            ${column}::timestamp
          ),
          'YYYY-MM-DD'
        )
      `

// --- analytics_states --------------------------------------------------------

export interface StateCount<A> {
  // First day of the period bucket of `start_day`
  readonly bucket: string | null
  readonly country: string | null
  readonly count: number
  readonly state: A
  // Keyed by the summed payload fields
  readonly sums: Readonly<Record<string, number>>
}

const StateCountRow = <A, I>(state: Schema.Schema<A, I>) =>
  Schema.Struct({
    bucket: Schema.NullOr(Schema.String),
    country: Schema.NullOr(Schema.String),
    count: Schema.Int,
    state,
    sums: Schema.Record({key: Schema.String, value: Schema.Number}),
  })

/**
 * Counts the rows of one definition per period bucket of `start_day` and per
 * combination of the payload fields in `state` (a pick of the definition's
 * payload schema), and sums the capped counters in `sums`. Every field is a
 * small enum, boolean or capped counter, so the groups stay few.
 */
export const countStates = <A, I>(
  name: string,
  {
    state,
    sums,
    days,
    period,
    byCountry = false,
    scope,
  }: {
    state: Schema.Schema<A, I> & {readonly fields: Schema.Struct.Fields}
    sums?: {readonly fields: Schema.Struct.Fields}
    days: DayRange | undefined
    period?: Period
    byCountry?: boolean
    scope: QueryScope
  }
): QueryResult<ReadonlyArray<StateCount<A>>> =>
  Effect.gen(function* (_) {
    if (days === undefined) return []
    const sql = yield* _(PgClient.PgClient)
    const sumKeys = sums ? Record.keys(sums.fields) : []
    const rows = yield* _(sql`
      SELECT
        ${bucketOf(sql, sql`start_day`, period)} AS bucket,
        ${byCountry ? sql`country_prefix` : sql`NULL::text`} AS country,
        jsonb_strip_nulls(
          jsonb_build_object(${sql.csv(
        Array.map(
          Record.keys(state.fields),
          (key) => sql`
            ${key}::text,
            payload -> ${storedKey(key)}::text
          `
        )
      )})
        ) AS state,
        jsonb_build_object(${sql.csv(
        Array.map(
          sumKeys,
          (key) => sql`
            ${key}::text,
            coalesce(
              sum(
                (
                  payload ->> ${storedKey(key)}::text
                )::int
              ),
              0
            )
          `
        )
      )}) AS sums,
        count(*)::int AS count
      FROM
        analytics_states
      WHERE
        ${sql.and([
        sql`name = ${name}`,
        sql`start_day >= ${days.from}::date`,
        sql`start_day < ${days.to}::date`,
        ...scopeConditions(sql, scope, {
          country: sql`country_prefix`,
          platform: sql`app_platform`,
        }),
      ])}
      GROUP BY
        1,
        2,
        3
    `)
    return yield* _(
      Schema.decodeUnknown(Schema.Array(StateCountRow(state)))(rows)
    )
  })

export const sumWhere = <A>(
  rows: ReadonlyArray<StateCount<A>>,
  predicate: (row: StateCount<A>) => boolean
): number =>
  pipe(
    rows,
    Array.filter(predicate),
    Array.reduce(0, (sum, row) => sum + row.count)
  )

// --- metrics -----------------------------------------------------------------

// Attributes a metric carries for the country and platform filters
export interface MetricDimensions {
  readonly country?: string
  readonly platform?: string
}

const attribute = (sql: PgClient.PgClient, key: string): Fragment => sql`
  attributes ->> ${storedKey(key)}::text
`

const metricScope = (
  sql: PgClient.PgClient,
  scope: QueryScope,
  {country, platform}: MetricDimensions
): Fragment[] =>
  scopeConditions(sql, scope, {
    country: country === undefined ? undefined : attribute(sql, country),
    platform: platform === undefined ? undefined : attribute(sql, platform),
  })

export interface MetricValue {
  readonly bucket: string | null
  // Value of the `by` attribute, or the country for gauges
  readonly key: string | null
  readonly value: number
}

const MetricValueRow = Schema.Struct({
  bucket: Schema.NullOr(Schema.String),
  key: Schema.NullOr(Schema.String),
  value: Schema.Number,
})

const timestampConditions = (
  sql: PgClient.PgClient,
  days: DayRange
): Fragment[] => [
  sql`"timestamp" >= ${days.from}::date`,
  sql`"timestamp" < ${days.to}::date`,
]

/** Increment metric: SUM(value) per period bucket and `by` attribute. */
export const sumMetric = ({
  name,
  where = {},
  atLeast = {},
  by,
  days,
  period,
  dimensions,
  scope,
}: {
  name: string
  // attribute -> required value
  where?: Readonly<Record<string, string>>
  // integer attribute -> minimum value
  atLeast?: Readonly<Record<string, number>>
  by?: string
  days: DayRange | undefined
  period?: Period
  dimensions: MetricDimensions
  scope: QueryScope
}): QueryResult<readonly MetricValue[]> =>
  Effect.gen(function* (_) {
    if (days === undefined) return []
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql`
      SELECT
        ${bucketOf(sql, sql`"timestamp"`, period)} AS bucket,
        ${by === undefined ? sql`NULL::text` : attribute(sql, by)} AS key,
        sum(value)::float8 AS value
      FROM
        metrics
      WHERE
        ${sql.and([
        sql`name = ${name}`,
        ...timestampConditions(sql, days),
        ...Array.map(
          Record.toEntries(where),
          ([key, value]) => sql`${attribute(sql, key)} = ${value}`
        ),
        ...Array.map(
          Record.toEntries(atLeast),
          ([key, value]) => sql`(${attribute(sql, key)})::int >= ${value}`
        ),
        ...metricScope(sql, scope, dimensions),
      ])}
      GROUP BY
        1,
        2
    `)
    return yield* _(Schema.decodeUnknown(Schema.Array(MetricValueRow))(rows))
  })

export interface GaugeValue extends MetricValue {
  readonly name: string
}

/**
 * Gauge metric: per period bucket and country the last (or first) report.
 * Countries of one report are written one by one, so each keeps its own
 * timestamp.
 */
export const gaugeMetric = ({
  names,
  pick,
  days,
  period,
  country,
  scope,
}: {
  names: Array.NonEmptyReadonlyArray<string>
  pick: 'first' | 'last'
  days: DayRange | undefined
  period?: Period
  country?: string
  // Without it every country is returned
  scope?: QueryScope
}): QueryResult<readonly GaugeValue[]> =>
  Effect.gen(function* (_) {
    if (days === undefined) return []
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql`
      SELECT DISTINCT
        ON (bucket, name, key) bucket,
        name,
        key,
        value
      FROM
        (
          SELECT
            ${bucketOf(sql, sql`"timestamp"`, period)} AS bucket,
            name,
            ${country === undefined
        ? sql`NULL::text`
        : attribute(sql, country)} AS key,
            value::float8 AS value,
            "timestamp"
          FROM
            metrics
          WHERE
            ${sql.and([
        sql`name IN ${sql.in(names)}`,
        ...timestampConditions(sql, days),
        ...(scope === undefined ? [] : metricScope(sql, scope, {country})),
      ])}
        ) AS reports
      ORDER BY
        bucket,
        name,
        key,
        "timestamp" ${sql.literal(pick === 'last' ? 'DESC' : 'ASC')}
    `)
    return yield* _(
      Schema.decodeUnknown(
        Schema.Array(
          Schema.extend(MetricValueRow, Schema.Struct({name: Schema.String}))
        )
      )(rows)
    )
  })

export const sumValues = <V extends MetricValue>(
  values: readonly V[],
  predicate: (value: V) => boolean = () => true
): number =>
  pipe(
    values,
    Array.filter(predicate),
    Array.reduce(0, (sum, item) => sum + item.value)
  )
