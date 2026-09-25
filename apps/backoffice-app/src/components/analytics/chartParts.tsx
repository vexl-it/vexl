import {type CategoryCounts} from '@/src/services/analytics/domain'
import {Array, Option, pipe, Record, type Schema} from 'effect'
import {Bar, Rectangle, type BarShapeProps} from 'recharts'
import {CHART_MUTED, CHART_OTHER} from '../chartTheme'

export const AXIS_TICK = {fontSize: 11, fill: CHART_MUTED}
export const CHART_MARGIN = {top: 4, right: 8, left: 0, bottom: 0}

export interface Series {
  readonly key: string
  readonly label: string
  readonly color: string
}

export interface WeekPoint {
  readonly weekStart: string
  readonly label: string
  readonly provisional: boolean
  readonly [key: string]: string | number | boolean | null
}

interface Week {
  readonly weekStart: string
  readonly provisional: boolean
}

const formatWeek = (weekStart: string): string =>
  new Date(weekStart).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

export const weekPoint = (
  week: Week,
  values: Readonly<Record<string, number | null>>
): WeekPoint => ({
  ...values,
  weekStart: week.weekStart,
  label: `${formatWeek(week.weekStart)}${week.provisional ? ' *' : ''}`,
  provisional: week.provisional,
})

export const categoryValues = (
  prefix: string,
  {counts, other}: CategoryCounts<string>
): Record<string, number> => ({
  ...Record.mapKeys(counts, (value) => `${prefix}:${value}`),
  [`${prefix}:other`]: other,
})

export const categorySeries = <L extends Array.NonEmptyReadonlyArray<string>>(
  prefix: string,
  values: Schema.Literal<L>,
  labels: Readonly<Record<L[number], string>>,
  colors: readonly string[]
): readonly Series[] => {
  const categories: ReadonlyArray<L[number]> = values.literals
  return [
    ...Array.map(categories, (value, index) => ({
      key: `${prefix}:${value}`,
      label: labels[value],
      color: colors[index] ?? CHART_OTHER,
    })),
    {key: `${prefix}:other`, label: 'Other (pooled)', color: CHART_OTHER},
  ]
}

// Spreads the ordinal ramp evenly over `count` ordered categories.
export const ordinalColors = (
  ramp: readonly string[],
  count: number
): readonly string[] =>
  Array.makeBy(
    count,
    (index) =>
      ramp[Math.round((index * (ramp.length - 1)) / Math.max(1, count - 1))] ??
      CHART_OTHER
  )

export const stackedBars = (
  series: readonly Series[],
  points: readonly WeekPoint[],
  stackId: string
): React.JSX.Element[] =>
  Array.map(series, (item) => (
    <Bar
      key={item.key}
      dataKey={item.key}
      name={item.label}
      stackId={stackId}
      fill={item.color}
      stroke="#ffffff"
      strokeWidth={1}
      maxBarSize={28}
      isAnimationActive={false}
      shape={(props: BarShapeProps) => (
        <Rectangle
          {...props}
          fillOpacity={
            pipe(
              Array.get(points, props.index),
              Option.exists((point) => point.provisional)
            )
              ? 0.4
              : 1
          }
        />
      )}
    />
  ))

export const formatShare = (value: number): string =>
  `${Math.round(value * 100)}%`

export function ChartLegend({series}: {readonly series: readonly Series[]}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      {pipe(
        series,
        Array.dedupeWith((left, right) => left.label === right.label),
        Array.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{backgroundColor: item.color}}
            />
            {item.label}
          </span>
        ))
      )}
    </div>
  )
}

export function ChartSection({
  title,
  description,
  hiddenWeeks,
  minGroupSize,
  children,
}: {
  readonly title: string
  readonly description: string
  readonly hiddenWeeks: number
  readonly minGroupSize: number
  readonly children: React.ReactNode
}) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <div className="mt-4">{children}</div>
      <p className="mt-3 text-xs text-gray-500">
        Population: reporting instances (installs with analytics enabled on a
        release that ships this definition), never users. * provisional week:
        uploads can still arrive, drawn faded. Groups under {minGroupSize}{' '}
        reporting instances are pooled into Other or hidden
        {hiddenWeeks > 0 ? ` (${hiddenWeeks} weeks hidden)` : ''}.
      </p>
    </section>
  )
}

export function EmptyChart({minGroupSize}: {readonly minGroupSize: number}) {
  return (
    <p className="py-8 text-center text-sm text-gray-500">
      No week has {minGroupSize} or more reporting instances yet.
    </p>
  )
}

// Lists the non-zero categories of one week, e.g. "Success 120, Other 12".
export const formatCounts = <V extends string>(
  {counts, other}: CategoryCounts<V>,
  labels: Readonly<Record<V, string>>
): string =>
  Array.join(
    [
      ...Array.filterMap(Record.toEntries(counts), ([value, count]) =>
        count > 0 ? Option.some(`${labels[value]} ${count}`) : Option.none()
      ),
      ...(other > 0 ? [`Other ${other}`] : []),
    ],
    ', '
  ) || 'none'

export function WeeklyTable<W extends Week>({
  weeks,
  columns,
}: {
  readonly weeks: readonly W[]
  readonly columns: ReadonlyArray<{
    readonly header: string
    readonly cell: (week: W) => string
  }>
}) {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
        Show data table
      </summary>
      <div className="overflow-x-auto">
        <table className="mt-2 text-xs tabular-nums">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-1 pr-6 font-medium">Week</th>
              {Array.map(columns, (column) => (
                <th key={column.header} className="py-1 pr-6 font-medium">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {Array.map(weeks, (week) => (
              <tr key={week.weekStart}>
                <td className="whitespace-nowrap py-0.5 pr-6">
                  {week.weekStart}
                  {week.provisional ? ' (provisional)' : ''}
                </td>
                {Array.map(columns, (column) => (
                  <td key={column.header} className="py-0.5 pr-6">
                    {column.cell(week)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
