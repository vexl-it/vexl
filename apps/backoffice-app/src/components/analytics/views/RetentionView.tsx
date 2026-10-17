'use client'

import {type RetentionData} from '@/src/services/analytics/domain'
import {CHART_BLUE, CHART_NEUTRAL} from '../../chartTheme'
import {
  BucketBarChart,
  ChartCard,
  CohortHeatmap,
  DataTable,
  TimeSeriesChart,
  seriesTable,
} from '../charts'
import {ViewData} from '../ViewData'

const REACTIVATION_SERIES = [
  {
    key: 'share',
    label: 'Core action within 7 days of returning',
    color: CHART_BLUE,
  },
]
const REACTIVATION_TABLE_SERIES = [
  {key: 'returned', label: 'Returned after 30+ days', color: CHART_NEUTRAL},
  {
    key: 'withCoreAction',
    label: 'Then a core action within 7 days',
    color: CHART_BLUE,
  },
]
const RATE_SERIES = [
  {key: 'rate', label: 'Came back that week', color: CHART_NEUTRAL},
]
const USERS_SERIES = [{key: 'users', label: 'Users', color: CHART_NEUTRAL}]
const SHARE_SERIES = [{key: 'share', label: 'Share', color: CHART_BLUE}]

export function RetentionView() {
  return (
    <ViewData view="retention">{(data) => <Retention data={data} />}</ViewData>
  )
}

function Retention({data}: {data: RetentionData}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={`Long-term retention by ${data.cohort.rowHeader.toLowerCase()}`}
          population="client"
          note={`Rows: new accounts registered that ${data.cohortPeriod}. W1 / W4 / W13: % of them that created an offer, sent or approved a request in the 1st, 4th or 13th week after registering (that single week, not cumulative), in the main marketplace and in Clubs. An install active in both counts in both. — = that week isn't over yet, or ended less than 14 days ago.`}
        >
          <CohortHeatmap data={data.cohort} />
        </ChartCard>
        <ChartCard
          title="D1 / D7 / D30 after registration"
          population="client"
          cohorts={data.registrationCohorts}
          note="% of new registrations that created an offer, sent or approved a request on the day after registering (D1), on days 7–13 (D7) or on days 28–34 (D30). We follow each install for 37 days after it first opens the app, so installs that registered 3+ days after first opening have no D30; D30 unknown is their share, and D30 leaves them out. Activated on registration day = created a first offer or sent a first request in the main marketplace that same day."
        >
          <DataTable data={data.dayRetention} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Reactivation rate (all users)"
          population="backend"
          scope="noCountryOrPlatform"
          note="Users who came back after 30+ days away, as % of the users who had been away 30+ days at the start of the week. Counted on our servers, per week."
          table={seriesTable(RATE_SERIES, data.reactivationRate, 'pct')}
        >
          <TimeSeriesChart
            series={RATE_SERIES}
            points={data.reactivationRate}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title="Dormant users"
          population="backend"
          scope="noCountryOrPlatform"
          note="Users whose app hasn't contacted our servers for 30+ days, at the end of each week."
          table={seriesTable(USERS_SERIES, data.dormantPool, 'count')}
        >
          <TimeSeriesChart
            series={USERS_SERIES}
            points={data.dormantPool}
            format="count"
          />
        </ChartCard>
        <ChartCard
          title="Returns after ≥30 days inactive"
          population="backend"
          note="Users whose app contacted our servers again after 30+ days of silence, counted on our servers. Not comparable with the install numbers on this page."
          table={seriesTable(USERS_SERIES, data.backendReturns, 'count')}
        >
          <TimeSeriesChart
            series={USERS_SERIES}
            points={data.backendReturns}
            format="count"
          />
        </ChartCard>
        <ChartCard
          title="Reactivated installs that did a core action"
          population="client"
          note="Of the installs that opened the app after 30+ days without opening it, the % that created an offer, sent or approved a request within 7 days of returning. The counts are in the data table."
          table={seriesTable(
            REACTIVATION_TABLE_SERIES,
            data.reactivations,
            'count'
          )}
        >
          <TimeSeriesChart
            series={REACTIVATION_SERIES}
            points={data.reactivations}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title="How returning installs came back"
          population="client"
          className="lg:col-span-2"
          cohorts={data.reactivationCohorts}
          note="Installs returning after 30+ days away, by the notification they opened to come back (or none), with the % that did a core action within 7 days. Coming back through a notification doesn't prove the notification caused it. Inactivity reminders show up once the app labels them; until then they count as Other."
        >
          <DataTable data={data.returnsByEntry} />
        </ChartCard>
        <ChartCard
          title="First action after returning"
          population="client"
          cohorts={data.reactivationCohorts}
          note="What installs returning after 30+ days away did first, as % of them. Only opened the app = none of these within 7 days."
          table={seriesTable(
            SHARE_SERIES,
            data.firstActionAfterReturn,
            'pct',
            'First action'
          )}
        >
          <BucketBarChart
            series={SHARE_SERIES}
            points={data.firstActionAfterReturn}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title="How long returning installs had been away"
          population="client"
          cohorts={data.reactivationCohorts}
          note="% of installs returning after 30+ days away, by how long since they last opened the app."
          table={seriesTable(SHARE_SERIES, data.dormantFor, 'pct', 'Away for')}
        >
          <BucketBarChart
            series={SHARE_SERIES}
            points={data.dormantFor}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title="Returns: Club members vs others"
          population="client"
          cohorts={data.reactivationCohorts}
          note="Installs returning after 30+ days away, split by whether they were in at least one Club when they came back, with the % that did a core action within 7 days."
        >
          <DataTable data={data.reactivationByClub} />
        </ChartCard>
      </div>
    </div>
  )
}
