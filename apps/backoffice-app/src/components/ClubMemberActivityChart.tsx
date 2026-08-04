'use client'

import type {ClubMemberCountChangeItem} from '@vexl-next/rest-api/src/services/contact/contracts'
import {useMemo, useState} from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const DAY_MS = 24 * 60 * 60 * 1000

// Palette validated for CVD safety and >=3:1 contrast on white
const BLUE = '#2a78d6'
const RED = '#e34948'
const GRID = '#e5e7eb'
const AXIS = '#d1d5db'
const MUTED = '#6b7280'

const RANGES = [
  {label: '1m', days: 30},
  {label: '3m', days: 91},
  {label: '6m', days: 183},
  {label: '1y', days: 366},
] as const

interface DayPoint {
  dayMs: number
  label: string
  joined: number
  leftNeg: number
  count: number | null
}

const utcMidnight = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())

const formatDay = (dayMs: number): string =>
  new Date(dayMs).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

const formatDayLong = (dayMs: number): string =>
  new Date(dayMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

const buildPoints = (
  changes: readonly ClubMemberCountChangeItem[],
  membersCount: number,
  rangeDays: number
): DayPoint[] => {
  const todayMs = utcMidnight(new Date())
  const changeByDay = new Map(
    changes.map((change) => [
      utcMidnight(change.day),
      {joined: change.joinedCount, left: change.leftCount},
    ])
  )
  const firstRecordedMs =
    changes.length > 0
      ? Math.min(...changes.map((change) => utcMidnight(change.day)))
      : todayMs

  // Reconstruct the members count per day by walking backwards from today.
  const countByDay = new Map<number, number>([[todayMs, membersCount]])
  for (let dayMs = todayMs; dayMs > firstRecordedMs; dayMs -= DAY_MS) {
    const change = changeByDay.get(dayMs)
    const countAtEndOfDay = countByDay.get(dayMs) ?? membersCount
    countByDay.set(
      dayMs - DAY_MS,
      countAtEndOfDay - (change?.joined ?? 0) + (change?.left ?? 0)
    )
  }

  const points: DayPoint[] = []
  for (
    let dayMs = todayMs - (rangeDays - 1) * DAY_MS;
    dayMs <= todayMs;
    dayMs += DAY_MS
  ) {
    const change = changeByDay.get(dayMs)
    points.push({
      dayMs,
      label: formatDay(dayMs),
      joined: change?.joined ?? 0,
      leftNeg: -(change?.left ?? 0),
      count: dayMs >= firstRecordedMs ? (countByDay.get(dayMs) ?? null) : null,
    })
  }
  return points
}

interface TooltipRow {
  label: string
  value: string
  color: string
}

function ChartTooltip({
  active,
  payload,
  rows,
}: {
  active?: boolean
  payload?: ReadonlyArray<{payload: DayPoint}>
  rows: (point: DayPoint) => TooltipRow[]
}): React.JSX.Element | null {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="text-xs text-gray-500">{formatDayLong(point.dayMs)}</p>
      {rows(point).map((row) => (
        <p key={row.label} className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-3"
            style={{backgroundColor: row.color}}
          />
          <span className="font-semibold text-gray-900">{row.value}</span>
          <span className="text-gray-500">{row.label}</span>
        </p>
      ))}
    </div>
  )
}

export function ClubMemberActivityChart({
  membersCount,
  changes,
}: {
  membersCount: number
  changes: readonly ClubMemberCountChangeItem[]
}): React.JSX.Element {
  const [rangeDays, setRangeDays] = useState<number>(30)
  const points = useMemo(
    () => buildPoints(changes, membersCount, rangeDays),
    [changes, membersCount, rangeDays]
  )
  const totalJoined = points.reduce((sum, point) => sum + point.joined, 0)
  const totalLeft = points.reduce((sum, point) => sum - point.leftNeg, 0)
  const tickInterval = Math.max(1, Math.floor(points.length / 6))
  const activityRows = points.filter(
    (point) => point.joined !== 0 || point.leftNeg !== 0
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          Last {rangeDays} days:{' '}
          <span className="font-medium text-gray-900">+{totalJoined}</span>{' '}
          joined,{' '}
          <span className="font-medium text-gray-900">-{totalLeft}</span> left
        </p>
        <div className="flex gap-1">
          {RANGES.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => {
                setRangeDays(range.days)
              }}
              className={
                rangeDays === range.days
                  ? 'rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white'
                  : 'rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50'
              }
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-gray-500">Members</p>
      <div className="mt-1 h-44">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{width: 640, height: 176}}
        >
          <LineChart
            data={points}
            syncId="club-member-activity"
            margin={{top: 4, right: 8, left: 0, bottom: 0}}
          >
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" hide />
            <YAxis
              width={40}
              allowDecimals={false}
              tick={{fontSize: 11, fill: MUTED}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={
                <ChartTooltip
                  rows={(point) => [
                    {
                      label: 'members',
                      value: String(point.count ?? 'no data'),
                      color: BLUE,
                    },
                  ]}
                />
              }
            />
            <Line
              type="stepAfter"
              dataKey="count"
              stroke={BLUE}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{backgroundColor: BLUE}}
          />
          Joined
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{backgroundColor: RED}}
          />
          Left
        </span>
      </div>
      <div className="mt-1 h-36">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{width: 640, height: 144}}
        >
          <BarChart
            data={points}
            syncId="club-member-activity"
            stackOffset="sign"
            margin={{top: 4, right: 8, left: 0, bottom: 0}}
            barGap={2}
          >
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tick={{fontSize: 11, fill: MUTED}}
              tickLine={false}
              axisLine={{stroke: AXIS}}
            />
            <YAxis
              width={40}
              allowDecimals={false}
              tick={{fontSize: 11, fill: MUTED}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={
                <ChartTooltip
                  rows={(point) => [
                    {
                      label: 'joined',
                      value: `+${point.joined}`,
                      color: BLUE,
                    },
                    {
                      label: 'left',
                      value: `-${-point.leftNeg}`,
                      color: RED,
                    },
                  ]}
                />
              }
            />
            <ReferenceLine y={0} stroke={AXIS} />
            <Bar
              dataKey="joined"
              stackId="delta"
              fill={BLUE}
              maxBarSize={16}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="leftNeg"
              stackId="delta"
              fill={RED}
              maxBarSize={16}
              radius={[0, 0, 2, 2]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
          Show data table
        </summary>
        {activityRows.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">
            No member activity recorded in this range.
          </p>
        ) : (
          <table className="mt-2 text-xs tabular-nums">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-1 pr-6 font-medium">Day</th>
                <th className="py-1 pr-6 font-medium">Joined</th>
                <th className="py-1 pr-6 font-medium">Left</th>
                <th className="py-1 font-medium">Members</th>
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {activityRows.map((point) => (
                <tr key={point.dayMs}>
                  <td className="py-0.5 pr-6">{formatDayLong(point.dayMs)}</td>
                  <td className="py-0.5 pr-6">+{point.joined}</td>
                  <td className="py-0.5 pr-6">-{-point.leftNeg}</td>
                  <td className="py-0.5">{point.count ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </details>
    </div>
  )
}
