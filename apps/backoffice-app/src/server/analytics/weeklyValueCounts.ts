import {PgClient} from '@effect/sql-pg'
import {type SqlError} from '@effect/sql/SqlError'
import {DayString} from '@vexl-next/analytics-definitions/src/core'
import {type AnalyticsDefinitionName} from '@vexl-next/analytics-definitions/src/registry'
import {
  Array,
  Effect,
  Number,
  pipe,
  Record,
  Schema,
  type ParseResult,
} from 'effect'

const RANGE_DAYS = 26 * 7

// Pseudo payload entry present once on every row, so its count is the number
// of reporting instances, including those with an empty payload.
const INSTANCES_KEY = '*'

const WeeklyValueCountRow = Schema.Struct({
  weekStart: DayString,
  countryPrefix: Schema.String,
  key: Schema.String,
  value: Schema.String,
  count: Schema.Int,
})
export type WeeklyValueCountRow = typeof WeeklyValueCountRow.Type

// Every payload field is an enum, boolean or capped counter, so unpivoting the
// payload into (key, value) pairs and counting them yields every histogram.
export const selectWeeklyValueCounts = (
  name: AnalyticsDefinitionName
): Effect.Effect<
  readonly WeeklyValueCountRow[],
  SqlError | ParseResult.ParseError,
  PgClient.PgClient
> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql`
      SELECT
        to_char(
          date_trunc('week', s.start_day::timestamp),
          'YYYY-MM-DD'
        ) AS week_start,
        s.country_prefix,
        f.key,
        f.value,
        count(*)::int AS count
      FROM
        analytics_states s
        CROSS JOIN LATERAL (
          SELECT
            key,
            value
          FROM
            jsonb_each_text(s.payload)
          UNION ALL
          SELECT
            ${INSTANCES_KEY}::text,
            ${INSTANCES_KEY}::text
        ) AS f (key, value)
      WHERE
        s.name = ${name}
        AND s.start_day >= date_trunc('week', CURRENT_DATE::timestamp)::date - ${RANGE_DAYS}::int
      GROUP BY
        1,
        2,
        3,
        4
    `)
    return yield* _(
      Schema.decodeUnknown(Schema.Array(WeeklyValueCountRow))(rows)
    )
  })

// payload key -> value -> count
export type ValueCounts = Readonly<
  Record<string, Readonly<Record<string, number>>>
>

export const toValueCounts = (
  rows: readonly WeeklyValueCountRow[]
): ValueCounts =>
  pipe(
    rows,
    Array.groupBy((row) => row.key),
    Record.map((keyRows) =>
      pipe(
        keyRows,
        Array.groupBy((row) => row.value),
        Record.map((valueRows) =>
          Number.sumAll(Array.map(valueRows, (row) => row.count))
        )
      )
    )
  )

export const instancesOf = (values: ValueCounts): number =>
  values[INSTANCES_KEY]?.[INSTANCES_KEY] ?? 0

export const payloadValueCounts = <S>(
  values: ValueCounts,
  key: keyof S & string
): Readonly<Record<string, number>> => values[key] ?? {}

export const sumCounts = (counts: Readonly<Record<string, number>>): number =>
  Number.sumAll(Record.values(counts))
