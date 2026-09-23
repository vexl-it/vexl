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
const RANGE_DAYS = 30

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
      Array.map(({day, count}) => [day, count] as const)
    )
  )
  const today = Date.now()

  return pipe(
    Array.makeBy(RANGE_DAYS, (index) =>
      isoDay(new Date(today - (RANGE_DAYS - 1 - index) * DAY_MS))
    ),
    Array.map((day) => ({
      day,
      label: formatDay(day),
      count: countByDay.get(day) ?? 0,
    }))
  )
}

export function ShortLinkClicksChart({
  dailyClicks,
}: {
  readonly dailyClicks: readonly ShortLinkDailyClicks[]
}) {
  const points = buildPoints(dailyClicks)

  return (
    <div className="h-40">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{width: 640, height: 160}}
      >
        <BarChart data={points} margin={{top: 4, right: 8, left: 0, bottom: 0}}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis
            dataKey="label"
            interval={4}
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
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
