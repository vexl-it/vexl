'use client'

import {
  cohortsNote,
  formatValue,
  PERIOD_ADJECTIVE,
  uniquePeriodOf,
  type CohortCell,
  type CohortData,
  type FunnelStep,
  type JourneyCohorts,
  type Population,
  type SeriesPoint,
  type TableData,
} from '@/src/services/analytics/domain'
import {Array, Option, pipe} from 'effect'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts'
import {
  CHART_AXIS,
  CHART_BLUE,
  CHART_GRID,
  CHART_MUTED,
  CHART_SEQUENTIAL,
} from '../chartTheme'
import {useAnalyticsFilters} from './filtersContext'

export type ValueFormat = 'count' | 'pct'

export interface ChartSeries {
  readonly key: string
  readonly label: string
  readonly color: string
}

interface Badge {
  readonly text: string
  readonly hint: string
}

const POPULATION_BADGE: Record<Population, Badge & {className: string}> = {
  client: {
    text: 'Installs with analytics on',
    hint: 'Reported by the app, only from installs that keep anonymous usage statistics on (the default). One phone is one install; we never count people.',
    className: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  },
  backend: {
    text: 'All users',
    hint: 'Counted on our servers, so it includes users who turned statistics off. Never divided by "Installs with analytics on" numbers: the two groups differ.',
    className: 'bg-gray-100 text-gray-700 ring-gray-300',
  },
}

export function PopulationBadge({population}: {population: Population}) {
  const badge = POPULATION_BADGE[population]
  return (
    <span
      title={badge.hint}
      className={`inline-flex cursor-help items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
    >
      {badge.text}
    </span>
  )
}

// Filters the source cannot be split by, so they are ignored
export type FilterScope = 'noCountry' | 'noPlatform' | 'noCountryOrPlatform'

const SCOPE_BADGE: Record<FilterScope, Badge> = {
  noCountry: {
    text: 'Not split by country',
    hint: 'This data has no country, so the country filter does not apply.',
  },
  noPlatform: {
    text: 'Not split by platform',
    hint: 'This data has no platform, so the platform filter does not apply.',
  },
  noCountryOrPlatform: {
    text: 'Not split by country or platform',
    hint: 'This data has no country or platform, so those filters do not apply.',
  },
}

function ScopeBadge({text, hint}: Badge) {
  return (
    <span
      title={hint}
      className="inline-flex cursor-help items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs text-gray-500 ring-1 ring-inset ring-gray-200"
    >
      {text}
    </span>
  )
}

export function DataTable({data}: {data: TableData}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs tabular-nums">
        <thead>
          <tr className="text-left text-gray-500">
            {Array.map(data.headers, (header) => (
              <th key={header} className="py-1 pr-6 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-gray-900">
          {Array.map(data.rows, (row) => (
            <tr key={row[0]} className="border-t border-gray-100">
              {Array.map(row, (cell, index) => (
                <td
                  key={data.headers[index]}
                  className={`py-1 pr-6 ${cell === '<20' || cell === 'n/a' || cell === '—' ? 'text-gray-400' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const hasMatureCohorts = (cohorts: JourneyCohorts | undefined): boolean =>
  cohorts === undefined || cohorts.span !== null

export function ChartCard({
  title,
  population,
  scope,
  uniqueCounts = false,
  cohorts,
  note,
  table,
  className = '',
  children,
}: {
  title: string
  population: Population
  scope?: FilterScope
  // Unique counts cannot be summed, so they fall back to a finer period
  uniqueCounts?: boolean
  // Snapshot of followed cohorts: shows the weeks covered, or replaces the
  // content when no week in the range is complete
  cohorts?: JourneyCohorts
  note?: React.ReactNode
  table?: TableData
  className?: string
  children: React.ReactNode
}) {
  const {period} = useAnalyticsFilters().filters
  const uniquePeriod = uniquePeriodOf(period)
  const mature = hasMatureCohorts(cohorts)
  return (
    <section className={`rounded-lg bg-white p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex flex-wrap gap-1">
          <PopulationBadge population={population} />
          {scope ? <ScopeBadge {...SCOPE_BADGE[scope]} /> : null}
          {uniqueCounts && uniquePeriod !== period ? (
            <ScopeBadge
              text={`Shown ${PERIOD_ADJECTIVE[uniquePeriod].toLowerCase()}`}
              hint={`An install active in several ${uniquePeriod}s would be counted more than once in a ${period}, so this is shown per ${uniquePeriod}.`}
            />
          ) : null}
        </div>
      </div>
      {cohorts ? (
        <p
          className={`mt-1 text-xs ${mature ? 'text-gray-500' : 'text-gray-400'}`}
        >
          {cohortsNote(cohorts)}
        </p>
      ) : null}
      {mature ? <div className="mt-3">{children}</div> : null}
      {note ? <p className="mt-2 text-xs text-gray-500">{note}</p> : null}
      {mature && table ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
            Show data table
          </summary>
          <div className="mt-2">
            <DataTable data={table} />
          </div>
        </details>
      ) : null}
    </section>
  )
}

export function StatTile({
  label,
  value,
  population,
  scope,
  hint,
  cohorts,
}: {
  label: string
  value: string
  population: Population
  scope?: FilterScope
  hint?: string
  // Snapshot of followed cohorts: see ChartCard
  cohorts?: JourneyCohorts
}) {
  const shown = hasMatureCohorts(cohorts) ? value : 'n/a'
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${shown === '<20' || shown === 'n/a' ? 'text-gray-400' : 'text-gray-900'}`}
      >
        {shown}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
      {cohorts ? (
        <p className="mt-0.5 text-xs text-gray-500">{cohortsNote(cohorts)}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1">
        <PopulationBadge population={population} />
        {scope ? <ScopeBadge {...SCOPE_BADGE[scope]} /> : null}
      </div>
    </div>
  )
}

const formatOf = (format: ValueFormat, value: number | null): string =>
  format === 'pct' ? formatValue.pct(value) : formatValue.count(value)

const formatTick = (format: ValueFormat) => (value: number) =>
  format === 'pct'
    ? `${value.toLocaleString('en', {maximumFractionDigits: 2})}%`
    : value.toLocaleString('en')

const valueOf =
  (key: string) =>
  (point: SeriesPoint): number | null =>
    point.values[key] ?? null

export const seriesTable = (
  series: readonly ChartSeries[],
  points: readonly SeriesPoint[],
  format: ValueFormat,
  labelHeader = 'Period'
): TableData => ({
  headers: [labelHeader, ...Array.map(series, (item) => item.label)],
  rows: Array.map(points, (point) => [
    point.provisional ? `${point.label} (not final yet)` : point.label,
    ...Array.map(series, (item) => formatOf(format, valueOf(item.key)(point))),
  ]),
})

const hasSuppressed = (
  series: readonly ChartSeries[],
  points: readonly SeriesPoint[]
): boolean =>
  Array.some(points, (point) =>
    Array.some(series, (item) => valueOf(item.key)(point) === null)
  )

function PointTooltip({
  active,
  payload,
  series,
  format,
}: {
  active?: boolean
  payload?: ReadonlyArray<{payload: SeriesPoint}>
  series: readonly ChartSeries[]
  format: ValueFormat
}): React.JSX.Element | null {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="text-xs text-gray-500">
        {point.label}
        {point.provisional ? ' · not final yet' : ''}
      </p>
      {Array.map(series, (item) => (
        <p key={item.key} className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{backgroundColor: item.color}}
          />
          <span className="font-semibold text-gray-900">
            {formatOf(format, valueOf(item.key)(point))}
          </span>
          <span className="text-gray-500">{item.label}</span>
        </p>
      ))}
    </div>
  )
}

function Legend({
  series,
  provisional,
  provisionalStyle,
  suppressedValues,
}: {
  series: readonly ChartSeries[]
  provisional: boolean
  provisionalStyle: 'dashed' | 'faded'
  suppressedValues: boolean
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
      {series.length > 1
        ? Array.map(series, (item) => (
            <span key={item.key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{backgroundColor: item.color}}
              />
              {item.label}
            </span>
          ))
        : null}
      {provisional ? (
        <span className="flex items-center gap-1.5 text-gray-500">
          {provisionalStyle === 'dashed' ? (
            <span className="inline-block w-4 border-t-2 border-dashed border-gray-400" />
          ) : (
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-300" />
          )}
          Not final yet (data still coming in)
        </span>
      ) : null}
      {suppressedValues ? (
        <span className="text-gray-500">Gaps: fewer than 20, hidden</span>
      ) : null}
    </div>
  )
}

export function TimeSeriesChart({
  series,
  points,
  format,
  height = 'h-48',
}: {
  series: readonly ChartSeries[]
  points: readonly SeriesPoint[]
  format: ValueFormat
  height?: string
}) {
  const lastMatureLabel = pipe(
    points,
    Array.findLast((point) => !point.provisional),
    Option.map((point) => point.label),
    Option.getOrNull
  )
  const provisionalSegment =
    (key: string) =>
    (point: SeriesPoint): number | null =>
      point.provisional || point.label === lastMatureLabel
        ? valueOf(key)(point)
        : null
  const matureSegment =
    (key: string) =>
    (point: SeriesPoint): number | null =>
      point.provisional ? null : valueOf(key)(point)

  return (
    <div>
      <Legend
        series={series}
        provisional={Array.some(points, (point) => point.provisional)}
        provisionalStyle="dashed"
        suppressedValues={hasSuppressed(series, points)}
      />
      <div className={height}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{width: 640, height: 192}}
        >
          <LineChart
            data={[...points]}
            margin={{top: 4, right: 8, left: 0, bottom: 0}}
          >
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{fontSize: 11, fill: CHART_MUTED}}
              tickLine={false}
              axisLine={{stroke: CHART_AXIS}}
            />
            <YAxis
              width={48}
              tickFormatter={formatTick(format)}
              tick={{fontSize: 11, fill: CHART_MUTED}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<PointTooltip series={series} format={format} />}
            />
            {Array.flatMap(series, (item) => [
              <Line
                key={item.key}
                dataKey={matureSegment(item.key)}
                stroke={item.color}
                strokeWidth={2}
                dot={{r: 2, fill: item.color, strokeWidth: 0}}
                connectNulls={false}
                isAnimationActive={false}
              />,
              <Line
                key={`${item.key}-provisional`}
                dataKey={provisionalSegment(item.key)}
                stroke={item.color}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{r: 2, fill: item.color, strokeWidth: 0}}
                connectNulls={false}
                isAnimationActive={false}
              />,
            ])}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function BucketBarChart({
  series,
  points,
  format,
  stacked = false,
  timeAxis = false,
  height = 'h-48',
}: {
  series: readonly ChartSeries[]
  points: readonly SeriesPoint[]
  format: ValueFormat
  stacked?: boolean
  timeAxis?: boolean
  height?: string
}) {
  const isShareStack = stacked && format === 'pct'
  return (
    <div>
      <Legend
        series={series}
        provisional={Array.some(points, (point) => point.provisional)}
        provisionalStyle="faded"
        suppressedValues={hasSuppressed(series, points)}
      />
      <div className={height}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{width: 640, height: 192}}
        >
          <BarChart
            data={[...points]}
            margin={{top: 4, right: 8, left: 0, bottom: 0}}
          >
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            <XAxis
              dataKey="label"
              interval={timeAxis ? 'preserveStartEnd' : 0}
              minTickGap={16}
              height={timeAxis ? undefined : 40}
              tick={{
                fontSize: 11,
                fill: CHART_MUTED,
                width: timeAxis ? undefined : 72,
              }}
              tickLine={false}
              axisLine={{stroke: CHART_AXIS}}
            />
            <YAxis
              width={48}
              domain={isShareStack ? [0, 100] : undefined}
              allowDataOverflow={isShareStack}
              tickFormatter={formatTick(format)}
              tick={{fontSize: 11, fill: CHART_MUTED}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{fill: CHART_GRID}}
              content={<PointTooltip series={series} format={format} />}
            />
            {Array.map(series, (item) => (
              <Bar
                key={item.key}
                dataKey={valueOf(item.key)}
                stackId={stacked ? 'stack' : undefined}
                fill={item.color}
                stroke="#ffffff"
                strokeWidth={stacked ? 1 : 0}
                maxBarSize={stacked ? 20 : 40}
                isAnimationActive={false}
                shape={(props: BarShapeProps) => (
                  <Rectangle
                    {...props}
                    fillOpacity={points[props.index]?.provisional ? 0.4 : 1}
                  />
                )}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Plain bars, scaled to the largest step: steps are recorded independently,
// so a later one can be larger than an earlier one
export function StepBars({steps}: {steps: readonly FunnelStep[]}) {
  const counts = Array.map(steps, (step) => step.count ?? 0)
  const largest = Array.reduce(counts, 1, Math.max)
  const first = pipe(
    Array.head(counts),
    Option.getOrElse(() => 0)
  )

  return (
    <div className="space-y-1.5">
      {Array.map(steps, (step) => (
        <div
          key={step.label}
          className="grid grid-cols-[9rem_1fr_9rem] items-center gap-3 text-xs sm:grid-cols-[12rem_1fr_11rem]"
        >
          <span className="truncate text-gray-700" title={step.label}>
            {step.label}
          </span>
          <div
            className="h-4 rounded-sm"
            style={{
              width: `${((step.count ?? 0) / largest) * 100}%`,
              backgroundColor: CHART_BLUE,
            }}
          />
          <span className="tabular-nums text-gray-900">
            <span className="font-semibold">
              {formatValue.count(step.count)}
            </span>
            <span className="text-gray-500">
              {' '}
              ·{' '}
              {step.count === null || first === 0
                ? 'n/a'
                : `${((step.count / first) * 100).toFixed(1)}%`}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

const cellText = (value: CohortCell): string => {
  if (value === 'pending') return '—'
  return value === null ? '<20' : `${value.toFixed(1)}%`
}

const heatColor = (value: number, max: number): string => {
  const step = Math.min(
    CHART_SEQUENTIAL.length - 1,
    Math.floor((value / max) * CHART_SEQUENTIAL.length)
  )
  return CHART_SEQUENTIAL[step] ?? CHART_SEQUENTIAL[0]
}

export function CohortHeatmap({data}: {data: CohortData}) {
  const max = pipe(
    data.rows,
    Array.flatMap((row) => row.values),
    Array.filter((value) => typeof value === 'number'),
    Array.reduce(1, Math.max)
  )
  return (
    <div className="max-h-96 overflow-auto">
      <table className="min-w-full border-separate border-spacing-0.5 text-xs tabular-nums">
        <thead className="sticky top-0 bg-white">
          <tr className="text-left text-gray-500">
            <th className="py-1 pr-4 font-medium">{data.rowHeader}</th>
            {Array.map(data.columns, (column) => (
              <th key={column} className="px-2 py-1 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.map(data.rows, (row) => (
            <tr key={row.label}>
              <td className="py-1 pr-4 text-gray-700">{row.label}</td>
              {Array.map(row.values, (value, index) => {
                const isNumber = typeof value === 'number'
                const dark = isNumber && value / max > 0.5
                return (
                  <td
                    key={data.columns[index]}
                    title={`${row.label} · ${data.columns[index]}: ${cellText(value)}`}
                    className={`rounded-sm px-2 py-1.5 text-center ${dark ? 'text-white' : isNumber ? 'text-gray-900' : 'text-gray-400'}`}
                    style={{
                      backgroundColor: isNumber
                        ? heatColor(value, max)
                        : '#f3f4f6',
                    }}
                  >
                    {cellText(value)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  hint,
  onChange,
}: {
  label: string
  value: T
  options: ReadonlyArray<{value: T; label: string}>
  hint?: string
  onChange: (value: T) => void
}) {
  return (
    <label className="text-sm">
      <span className="block text-xs font-medium text-gray-500">
        {label}
        {hint ? <span className="font-normal"> · {hint}</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => {
          pipe(
            options,
            Array.findFirst((option) => option.value === event.target.value),
            Option.map((option) => {
              onChange(option.value)
            })
          )
        }}
        className="mt-1 block rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none"
      >
        {Array.map(options, (option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
