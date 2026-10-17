'use client'

import {
  type ActivityData,
  formatValue,
  PERIOD_ADJECTIVE,
  uniquePeriodOf,
} from '@/src/services/analytics/domain'
import {
  CHART_BLUE,
  CHART_NEUTRAL,
  CHART_ORANGE,
  CHART_SEQUENTIAL,
} from '../../chartTheme'
import {
  BucketBarChart,
  ChartCard,
  DataTable,
  seriesTable,
  StatTile,
  TimeSeriesChart,
} from '../charts'
import {useAnalyticsFilters} from '../filtersContext'
import {ViewData} from '../ViewData'

const ACTIVE_SERIES = [
  {
    key: 'mainOnly',
    label: 'Core action: main marketplace only',
    color: CHART_BLUE,
  },
  {key: 'both', label: 'Core action: both', color: CHART_SEQUENTIAL[5]},
  {key: 'clubOnly', label: 'Core action: Clubs only', color: CHART_ORANGE},
  {key: 'openedOnly', label: 'Opened, no core action', color: CHART_NEUTRAL},
]
const ACTIVE_TABLE_SERIES = [
  ...ACTIVE_SERIES,
  {key: 'opened', label: 'Opened the app (total)', color: CHART_NEUTRAL},
]
const STICKINESS_SERIES = [
  {key: 'opened', label: 'Opened the app', color: CHART_NEUTRAL},
  {key: 'core', label: 'Core action', color: CHART_BLUE},
]
const DAYS_SERIES = [{key: 'share', label: 'Share', color: CHART_BLUE}]
const OPENS_SERIES = [
  {key: 'perInstall', label: 'Opens per active install', color: CHART_BLUE},
]
const OPENS_TABLE_SERIES = [
  ...OPENS_SERIES,
  {key: 'opens', label: 'Opens (total)', color: CHART_BLUE},
]
const BACKEND_ACTIVE_SERIES = [
  {key: 'users', label: 'Users', color: CHART_NEUTRAL},
]

export function ActivityView() {
  return (
    <ViewData view="activity">{(data) => <Activity data={data} />}</ViewData>
  )
}

function Activity({data}: {data: ActivityData}) {
  const {filters} = useAnalyticsFilters()
  const {tiles} = data

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          label="Daily / weekly / monthly active · opened the app"
          value={`${formatValue.count(tiles.day.value)} / ${formatValue.count(tiles.week.value)} / ${formatValue.count(tiles.month.value)}`}
          population="client"
          hint={`Installs that opened the app on ${tiles.day.label}, in the week of ${tiles.week.label} and in ${tiles.month.label}: the latest periods with complete data (we wait 14 days after a period ends).`}
        />
        <StatTile
          label="Daily / weekly / monthly active · core action"
          value={`${formatValue.count(tiles.dayCore.value)} / ${formatValue.count(tiles.weekCore.value)} / ${formatValue.count(tiles.monthCore.value)}`}
          population="client"
          hint="Same periods, counting installs that created an offer, sent a request or approved a request."
        />
      </div>

      <ChartCard
        title={`${PERIOD_ADJECTIVE[uniquePeriodOf(filters.period)]} active installs`}
        population="client"
        uniqueCounts
        note="Number of different installs that opened the app in each period; the full bar is all of them. Each install is in exactly one color, by what it did that period, so the colors add up to the total. An install active on several days still counts once in the week, so a week is not the sum of its days."
        table={seriesTable(ACTIVE_TABLE_SERIES, data.actives, 'count')}
      >
        <BucketBarChart
          series={ACTIVE_SERIES}
          points={data.actives}
          format="count"
          stacked
          height="h-56"
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Stickiness: weekly vs monthly active, per month"
          population="client"
          note="Average weekly active installs in the month, divided by the month's monthly active installs. Higher means people come back week after week rather than once a month. Complete months only."
          table={seriesTable(STICKINESS_SERIES, data.stickiness, 'pct')}
        >
          <TimeSeriesChart
            series={STICKINESS_SERIES}
            points={data.stickiness}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title={`Active days per week · week of ${data.lastSettledWeek}`}
          population="client"
          note="Installs that opened the app that week, by how many different days they opened it (1 to 7). Latest week with complete data."
          table={seriesTable(
            DAYS_SERIES,
            data.activeDays,
            'pct',
            'Active days'
          )}
        >
          <BucketBarChart
            series={DAYS_SERIES}
            points={data.activeDays}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title={`Core actions per active install · week of ${data.lastSettledWeek}`}
          population="client"
          note="Average per install that did at least one core action that week, main marketplace and Clubs together. Each install counts up to a fixed maximum per week, so the averages are slightly low."
        >
          <DataTable data={data.actionsPerInstall} />
        </ChartCard>
        <ChartCard
          title="Offers opened per active install, per week"
          population="client"
          note="How many times an offer's detail was opened, divided by the installs that opened the app that week; main marketplace and Clubs together. Each install counts at most 200 per week."
          table={seriesTable(OPENS_TABLE_SERIES, data.offersOpened, 'count')}
        >
          <TimeSeriesChart
            series={OPENS_SERIES}
            points={data.offersOpened}
            format="count"
          />
        </ChartCard>
        <ChartCard
          title="Active users (last 30 days)"
          population="backend"
          scope="noPlatform"
          note="Users whose app contacted our servers in the 30 days before each week's end, which roughly means they opened it. Not comparable with the install numbers above."
          table={seriesTable(
            BACKEND_ACTIVE_SERIES,
            data.backendActive30d,
            'count'
          )}
        >
          <TimeSeriesChart
            series={BACKEND_ACTIVE_SERIES}
            points={data.backendActive30d}
            format="count"
          />
        </ChartCard>
      </div>
    </div>
  )
}
