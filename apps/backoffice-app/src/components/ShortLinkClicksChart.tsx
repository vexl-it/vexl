'use client'

import {type ShortLinkDailyClicks} from '@/src/services/shortLinks/domain'
import {Array, pipe} from 'effect'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {CHART_AXIS, CHART_BLUE, CHART_GRID, CHART_MUTED} from './chartTheme'

const DAY_MS = 24 * 60 * 60 * 1000
export const CLICKS_RANGE_DAYS = 30

interface DayPoint {
  readonly day: string
  readonly label: string
  readonly count: number
}

const isoDay = (date: Date): string => date.toISOString().slice(0, 10)

const formatDay = (day: string): string =>
  new Date(day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

// The server only returns days with clicks; fill the rest with zeros.
const buildPoints = (
  dailyClicks: readonly ShortLinkDailyClicks[]
): readonly DayPoint[] => {
  const countByDay = new Map(
    pipe(
      dailyClicks,
      Array.map(({day, count}): readonly [string, number] => [day, count])
    )
  )
  const today = Date.now()

  return pipe(
    Array.makeBy(CLICKS_RANGE_DAYS, (index) =>
      isoDay(new Date(today - (CLICKS_RANGE_DAYS - 1 - index) * DAY_MS))
    ),
    Array.map((day) => ({
      day,
      label: formatDay(day),
      count: countByDay.get(day) ?? 0,
    }))
  )
}

interface ChartProps {
  readonly dailyClicks: readonly ShortLinkDailyClicks[]
}

export function ShortLinkClicksChart({dailyClicks}: ChartProps) {
  const points = buildPoints(dailyClicks)
  const weeklyTicks = pipe(
    points,
    Array.filter((_, index) => (CLICKS_RANGE_DAYS - 1 - index) % 7 === 0),
    Array.map(({label}) => label)
  )

  return (
    <div className="h-48">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{width: 560, height: 192}}
      >
        <BarChart data={points} margin={{top: 4, right: 8, left: 0, bottom: 0}}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis
            dataKey="label"
            ticks={weeklyTicks}
            interval={0}
            tick={{fontSize: 11, fill: CHART_MUTED}}
            tickLine={false}
            axisLine={{stroke: CHART_AXIS}}
          />
          <YAxis
            width={40}
            allowDecimals={false}
            tick={{fontSize: 11, fill: CHART_MUTED}}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{fill: CHART_GRID}}
            formatter={(value) => [value, 'clicks']}
          />
          <Bar
            dataKey="count"
            fill={CHART_BLUE}
            maxBarSize={16}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** The same 30 days as the chart, scaled to the link's own busiest day. */
export function ShortLinkSparkline({dailyClicks}: ChartProps) {
  const points = buildPoints(dailyClicks)
  const max = pipe(
    points,
    Array.reduce(1, (highest, {count}) => Math.max(highest, count))
  )

  return (
    <div
      role="img"
      aria-label={`Clicks per day, last ${CLICKS_RANGE_DAYS} days`}
      className="flex h-6 w-28 items-end gap-px"
    >
      {pipe(
        points,
        Array.map(({day, label, count}) => (
          <div
            key={day}
            title={`${label}: ${count}`}
            className="min-h-px flex-1 rounded-t-[1px]"
            style={{
              height: `${(count / max) * 100}%`,
              backgroundColor: count > 0 ? CHART_BLUE : CHART_AXIS,
            }}
          />
        ))
      )}
    </div>
  )
}
