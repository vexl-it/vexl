'use client'

import {
  type AnalyticsDashboard,
  type MarketplaceWeek,
} from '@/src/services/analytics/domain'
import {OffersVisibleBucket} from '@vexl-next/analytics-definitions/src/buckets'
import {FirstLoadResult} from '@vexl-next/analytics-definitions/src/definitions/marketplaceWeekly'
import {Array, Option, pipe} from 'effect'
import {useState} from 'react'
import {
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_ORDINAL,
  CHART_SERIES,
} from '../chartTheme'
import {
  AXIS_TICK,
  categorySeries,
  categoryValues,
  CHART_MARGIN,
  ChartLegend,
  ChartSection,
  EmptyChart,
  formatCounts,
  formatShare,
  ordinalColors,
  stackedBars,
  WeeklyTable,
  weekPoint,
  type Series,
  type WeekPoint,
} from './chartParts'
import {
  FIRST_LOAD_LABELS,
  MARKETPLACE_OPENED_LABELS,
  OFFERS_VISIBLE_LABELS,
} from './labels'

const ALL_COUNTRIES = 'all'

const firstLoadSeries = categorySeries(
  'firstLoad',
  FirstLoadResult,
  FIRST_LOAD_LABELS,
  CHART_SERIES
)
const offersVisibleSeries = categorySeries(
  'offersVisible',
  OffersVisibleBucket,
  OFFERS_VISIBLE_LABELS,
  ordinalColors(CHART_ORDINAL, OffersVisibleBucket.literals.length)
)

const countryLabel = (countryPrefix: string): string => {
  if (countryPrefix === 'other') return 'Other countries (pooled)'
  if (countryPrefix === 'none') return 'No country'
  return `+${countryPrefix}`
}

const emptyRate = (week: MarketplaceWeek): string => {
  const empty = week.firstLoadResult.counts.empty
  return empty > 0 ? formatShare(empty / week.instances) : 'n/a'
}

function ShareBarChart({
  title,
  series,
  points,
  stackId,
}: {
  readonly title: string
  readonly series: readonly Series[]
  readonly points: readonly WeekPoint[]
  readonly stackId: string
}) {
  return (
    <>
      <p className="mt-4 text-xs font-medium text-gray-500">{title}</p>
      <div className="mt-1">
        <ChartLegend series={series} />
      </div>
      <div className="mt-1 h-56">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{width: 640, height: 224}}
        >
          <BarChart
            data={points}
            stackOffset="expand"
            syncId="marketplace-weekly"
            margin={CHART_MARGIN}
          >
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{stroke: CHART_AXIS}}
            />
            <YAxis
              width={48}
              tickFormatter={formatShare}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{fill: CHART_GRID}}
              formatter={(value, name) => [
                `${String(value)} reporting instances`,
                name,
              ]}
            />
            {stackedBars(series, points, stackId)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

export function MarketplaceChart({
  report,
  minGroupSize,
}: {
  readonly report: AnalyticsDashboard['marketplace']
  readonly minGroupSize: number
}) {
  const [country, setCountry] = useState(ALL_COUNTRIES)
  const weeks = pipe(
    report.countries,
    Array.findFirst((item) => item.countryPrefix === country),
    Option.match({
      onNone: () => report.weeks,
      onSome: (item) => item.weeks,
    })
  )
  const points = Array.map(weeks, (week) =>
    weekPoint(week, {
      ...categoryValues('firstLoad', week.firstLoadResult),
      ...categoryValues('offersVisible', week.offersVisibleBucket),
    })
  )

  return (
    <ChartSection
      title="Marketplace first load by week"
      description="First unfiltered main-marketplace load of each reporting instance in the week: empty-marketplace rate and how many offers it showed. Weeks settle 14 days after they end."
      hiddenWeeks={report.hiddenWeeks}
      minGroupSize={minGroupSize}
    >
      <label className="text-sm text-gray-700">
        Country{' '}
        <select
          value={country}
          onChange={(event) => {
            setCountry(event.target.value)
          }}
          className="ml-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          <option value={ALL_COUNTRIES}>All countries</option>
          {Array.map(report.countries, (item) => (
            <option key={item.countryPrefix} value={item.countryPrefix}>
              {countryLabel(item.countryPrefix)}
            </option>
          ))}
        </select>
      </label>
      {Array.isNonEmptyReadonlyArray(points) ? (
        <>
          <ShareBarChart
            title="First load result, share of reporting instances"
            series={firstLoadSeries}
            points={points}
            stackId="firstLoad"
          />
          <ShareBarChart
            title="Offers visible on the first successful load, share of reporting instances that loaded"
            series={offersVisibleSeries}
            points={points}
            stackId="offersVisible"
          />
          <WeeklyTable
            weeks={weeks}
            columns={[
              {
                header: 'Reporting instances',
                cell: (week) => String(week.instances),
              },
              {header: 'Empty rate', cell: emptyRate},
              {
                header: 'Offers visible',
                cell: (week) =>
                  formatCounts(week.offersVisibleBucket, OFFERS_VISIBLE_LABELS),
              },
              {
                header: 'Marketplace opens in the week',
                cell: (week) =>
                  formatCounts(
                    week.marketplaceOpened,
                    MARKETPLACE_OPENED_LABELS
                  ),
              },
            ]}
          />
        </>
      ) : (
        <EmptyChart minGroupSize={minGroupSize} />
      )}
    </ChartSection>
  )
}
