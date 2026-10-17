'use client'

import {type ClubsData} from '@/src/services/analytics/domain'
import {CHART_BLUE, CHART_NEUTRAL, CHART_ORANGE} from '../../chartTheme'
import {
  BucketBarChart,
  ChartCard,
  DataTable,
  TimeSeriesChart,
  seriesTable,
} from '../charts'
import {ViewData} from '../ViewData'

const JOIN_SERIES = [{key: 'joins', label: 'Joins', color: CHART_ORANGE}]
const MARKETPLACE_USE_SERIES = [
  {
    key: 'membersMain',
    label: 'Club members: core action in main marketplace',
    color: CHART_BLUE,
  },
  {
    key: 'membersClub',
    label: 'Club members: core action in Clubs',
    color: CHART_ORANGE,
  },
  {
    key: 'othersMain',
    label: 'Not in a Club: core action in main marketplace',
    color: CHART_NEUTRAL,
  },
]
const SHARE_SERIES = [{key: 'share', label: 'Share', color: CHART_ORANGE}]

export function ClubsView() {
  return <ViewData view="clubs">{(data) => <Clubs data={data} />}</ViewData>
}

function Clubs({data}: {data: ClubsData}) {
  return (
    <div className="space-y-4">
      <p className="rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-600">
        All numbers cover all Clubs together; we never report individual Clubs.
        How many installs act in Clubs, in the main marketplace or in both is on
        the Activity tab.
      </p>

      <ChartCard
        title="Do Club joiners reach the main marketplace?"
        population="client"
        cohorts={data.cohorts}
        note="New registrations, split by whether and when they joined a Club in their first 37 days after first opening the app; columns are % of each group. — = can't happen for that group. For installs that registered more than 7 days after first opening, the 30-day activation window is cut short. Saw at least 1 main offer = their first marketplace visit showed at least one main-marketplace offer."
      >
        <DataTable data={data.conversion} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Do Club members use the main marketplace? (per week)"
          population="client"
          note="Installs that opened the app that week, split by whether they were in at least one Club: % that created an offer, sent or approved a request in the main marketplace, and (for members) in Clubs."
          table={seriesTable(
            MARKETPLACE_USE_SERIES,
            data.marketplaceUse,
            'pct'
          )}
        >
          <TimeSeriesChart
            series={MARKETPLACE_USE_SERIES}
            points={data.marketplaceUse}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title="Club joins"
          population="backend"
          note="Successful Club joins per period, counted on our servers."
          table={seriesTable(JOIN_SERIES, data.joins, 'count')}
        >
          <BucketBarChart
            series={JOIN_SERIES}
            points={data.joins}
            format="count"
          />
        </ChartCard>
        <ChartCard
          title={`Weekly active installs by number of Clubs · week of ${data.lastSettledWeek}`}
          population="client"
          note="Installs that opened the app that week, by how many Clubs they were in when they first opened it that week."
          table={seriesTable(
            SHARE_SERIES,
            data.clubsPerInstall,
            'pct',
            'Clubs'
          )}
        >
          <BucketBarChart
            series={SHARE_SERIES}
            points={data.clubsPerInstall}
            format="pct"
          />
        </ChartCard>
      </div>
    </div>
  )
}
