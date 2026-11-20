'use client'

import {formatUtcDay} from '@/src/services/clubs'
import {formatUtcDayShort} from '@/src/services/format'
import type {ClubMemberCountChangeItem} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, pipe} from 'effect'
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
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_MUTED,
  CHART_NEGATIVE,
  CHART_POSITIVE,
  CHART_PRIMARY,
} from './chartTheme'
import {SegmentedControl, type SegmentedOption, Table, Td, Th, Tr} from './ui'

const DAY_MS = 24 * 60 * 60 * 1000

const GRID = CHART_GRID
const AXIS = CHART_AXIS
const MUTED = CHART_MUTED

const RANGES: ReadonlyArray<SegmentedOption<number>> = [
  {label: '1m', value: 30},
  {label: '3m', value: 91},
  {label: '6m', value: 183},
  {label: '1y', value: 366},
]

interface DayPoint {
  dayMs: number
  label: string
  joined: number
  leftNeg: number
  count: number | null
}

// The server serializes the date-only `day` column as local midnight, so key
// days by local date components — UTC components would shift days one back.
const utcMidnight = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())

const buildPoints = (
  changes: readonly ClubMemberCountChangeItem[],
  membersCount: number,
  rangeDays: number
): DayPoint[] => {
  const todayMs = utcMidnight(new Date())
  const changeByDay = new Map(
    Array.map(changes, (change): [number, {joined: number; left: number}] => [
      utcMidnight(change.day),
      {joined: change.joinedCount, left: change.leftCount},
    ])
  )
  const firstRecordedMs = Math.min(todayMs, ...changeByDay.keys())

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

  return Array.makeBy(rangeDays, (index) => {
    const dayMs = todayMs - (rangeDays - 1 - index) * DAY_MS
    const change = changeByDay.get(dayMs)
    return {
      dayMs,
      label: formatUtcDayShort(dayMs),
      joined: change?.joined ?? 0,
      leftNeg: -(change?.left ?? 0),
      count: dayMs >= firstRecordedMs ? (countByDay.get(dayMs) ?? null) : null,
    }
  })
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
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-sm shadow-overlay">
      <p className="text-xs text-ink-muted">
        {formatUtcDay(new Date(point.dayMs))}
      </p>
      {Array.map(rows(point), (row) => (
        <p key={row.label} className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-3"
            style={{backgroundColor: row.color}}
          />
          <span className="font-semibold text-ink">{row.value}</span>
          <span className="text-ink-muted">{row.label}</span>
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
  const totalJoined = Array.reduce(points, 0, (sum, {joined}) => sum + joined)
  const totalLeft = Array.reduce(points, 0, (sum, {leftNeg}) => sum - leftNeg)
  const tickInterval = Math.max(1, Math.floor(points.length / 6))
  const activityRows = pipe(
    points,
    Array.filter((point) => point.joined !== 0 || point.leftNeg !== 0),
    Array.reverse
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted">
          Last {rangeDays} days:{' '}
          <span className="font-medium text-ink">+{totalJoined}</span> joined,{' '}
          <span className="font-medium text-ink">−{totalLeft}</span> left
        </p>
        <SegmentedControl
          label="Range"
          value={rangeDays}
          onChange={setRangeDays}
          options={RANGES}
        />
      </div>

      <p className="mt-4 text-xs font-medium text-ink-muted">Members</p>
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
              domain={['auto', 'auto']}
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
                      color: CHART_PRIMARY,
                    },
                  ]}
                />
              }
            />
            <Line
              type="stepAfter"
              dataKey="count"
              stroke={CHART_PRIMARY}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{backgroundColor: CHART_POSITIVE}}
          />
          Joined
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{backgroundColor: CHART_NEGATIVE}}
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
                      color: CHART_POSITIVE,
                    },
                    {
                      label: 'left',
                      value: `−${-point.leftNeg}`,
                      color: CHART_NEGATIVE,
                    },
                  ]}
                />
              }
            />
            <ReferenceLine y={0} stroke={AXIS} />
            <Bar
              dataKey="joined"
              stackId="delta"
              fill={CHART_POSITIVE}
              maxBarSize={16}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="leftNeg"
              stackId="delta"
              fill={CHART_NEGATIVE}
              maxBarSize={16}
              radius={[0, 0, 2, 2]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
          Show data table
        </summary>
        <div className="mt-2 overflow-hidden rounded-control border border-line tabular-nums">
          <Table
            head={
              <>
                <Th>Day</Th>
                <Th align="right">Joined</Th>
                <Th align="right">Left</Th>
                <Th align="right">Members</Th>
              </>
            }
            empty={
              <p className="px-4 py-6 text-center text-sm text-ink-muted">
                No member activity recorded in this range.
              </p>
            }
          >
            {Array.map(activityRows, (point) => (
              <Tr key={point.dayMs}>
                <Td>{formatUtcDay(new Date(point.dayMs))}</Td>
                <Td align="right">+{point.joined}</Td>
                <Td align="right">−{-point.leftNeg}</Td>
                <Td align="right">{point.count ?? '–'}</Td>
              </Tr>
            ))}
          </Table>
        </div>
      </details>
    </div>
  )
}
