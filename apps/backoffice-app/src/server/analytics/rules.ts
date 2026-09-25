import {CategoryCounts, JourneyOutcome} from '@/src/services/analytics/domain'
import {
  analyticsStateMaxAgeDays,
  defaultAnalyticsWindow,
  type AnalyticsRetentionShape,
  type DayString,
} from '@vexl-next/analytics-definitions/src/core'
import {
  Array,
  Effect,
  Number,
  Order,
  pipe,
  Record,
  Schema,
  type ParseResult,
} from 'effect'
import {
  instancesOf,
  toValueCounts,
  type ValueCounts,
  type WeeklyValueCountRow,
} from './weeklyValueCounts'

const DAY_MS = 24 * 60 * 60 * 1000

const daysBetween = (from: DayString, to: DayString): number =>
  (Date.parse(to) - Date.parse(from)) / DAY_MS

// A week stays provisional while the server can still accept uploads for an
// instance started in it: journeys may start on the week's last day,
// aggregation buckets start on the week start.
export const isWeekProvisional = (
  definition: AnalyticsRetentionShape,
  weekStart: DayString,
  today: DayString
): boolean => {
  const lastStartOffsetDays = definition.kind === 'journey' ? 6 : 0
  return (
    daysBetween(weekStart, today) - lastStartOffsetDays <=
    analyticsStateMaxAgeDays(definition, defaultAnalyticsWindow)
  )
}

export const suppressCounts = <L extends Array.NonEmptyReadonlyArray<string>>(
  values: Schema.Literal<L>,
  counts: Readonly<Record<string, number>>,
  minGroupSize: number
): Effect.Effect<CategoryCounts<L[number]>, ParseResult.ParseError> => {
  const categories: readonly string[] = values.literals
  const [small, shown] = Array.partition(
    Record.toEntries(counts),
    ([, count]) => count >= minGroupSize
  )
  return Schema.decodeUnknown(CategoryCounts(values), {
    onExcessProperty: 'error',
  })({
    counts: {
      ...Record.fromEntries(Array.map(categories, (value) => [value, 0])),
      ...Record.fromEntries(shown),
    },
    other: Number.sumAll(Array.map(small, ([, count]) => count)),
  })
}

export const journeyOutcome = ({
  instances,
  completed,
  provisional,
  minGroupSize,
}: {
  readonly instances: number
  readonly completed: number
  readonly provisional: boolean
  readonly minGroupSize: number
}): Effect.Effect<CategoryCounts<JourneyOutcome>, ParseResult.ParseError> =>
  suppressCounts(
    JourneyOutcome,
    {completed, [provisional ? 'open' : 'unknown']: instances - completed},
    minGroupSize
  )

export interface WeekValues {
  readonly weekStart: DayString
  readonly instances: number
  readonly values: ValueCounts
}

// Weeks with fewer reporting instances than the minimum group size are
// dropped entirely; only how many were dropped is reported.
export const buildWeeklyReport = <W, E>(
  rows: readonly WeeklyValueCountRow[],
  minGroupSize: number,
  buildWeek: (week: WeekValues) => Effect.Effect<W, E>
): Effect.Effect<{readonly weeks: W[]; readonly hiddenWeeks: number}, E> => {
  const [hidden, shown] = pipe(
    rows,
    Array.groupBy((row) => row.weekStart),
    Record.values,
    Array.map((weekRows): WeekValues => {
      const values = toValueCounts(weekRows)
      return {
        weekStart: weekRows[0].weekStart,
        instances: instancesOf(values),
        values,
      }
    }),
    Array.partition((week) => week.instances >= minGroupSize)
  )
  return pipe(
    shown,
    Array.sort(
      Order.mapInput(Order.string, (week: WeekValues) => week.weekStart)
    ),
    Effect.forEach(buildWeek),
    Effect.map((weeks) => ({weeks, hiddenWeeks: hidden.length}))
  )
}
