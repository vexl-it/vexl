'use client'

import {formatValue, type FunnelData} from '@/src/services/analytics/domain'
import {Array} from 'effect'
import {CHART_BLUE, CHART_NEUTRAL, CHART_ORANGE} from '../../chartTheme'
import {
  BucketBarChart,
  ChartCard,
  DataTable,
  StatTile,
  StepBars,
  TimeSeriesChart,
  seriesTable,
} from '../charts'
import {useAnalyticsFilters} from '../filtersContext'
import {ViewData} from '../ViewData'

const ACTIVATION_SERIES = [
  {key: 'main', label: 'Activated in main marketplace', color: CHART_BLUE},
  {key: 'club', label: 'Activated in Clubs only', color: CHART_ORANGE},
]
const USERS_SERIES = [{key: 'users', label: 'Users', color: CHART_NEUTRAL}]
const SHARE_SERIES = [{key: 'share', label: 'Share', color: CHART_BLUE}]
const ACTIVATED_SERIES = [
  {key: 'activated', label: 'Activated', color: CHART_BLUE},
]

export function FunnelView() {
  return <ViewData view="funnel">{(data) => <Funnel data={data} />}</ViewData>
}

function Funnel({data}: {data: FunnelData}) {
  const {filters} = useAnalyticsFilters()
  const steps = [...data.anyAccountSteps, ...data.newAccountSteps]

  return (
    <div className="space-y-4">
      <StatTile
        label="Activation rate, main marketplace"
        value={formatValue.pct(data.activationRate)}
        population="client"
        hint={`% of new registrations (people logging back into an existing account are left out) that created a first offer or sent a first request in the main marketplace within 30 days of registering. Another ${formatValue.pct(data.clubOnlyActivationRate)} did so only in Clubs; they are not included.`}
        cohorts={data.cohorts}
      />

      <ChartCard
        title="Onboarding steps"
        population="client"
        cohorts={data.cohorts}
        note={
          <>
            We follow each new install for 37 days after it first opens the app.
            Each step is recorded on its own, so a step can occasionally be
            larger than the one before; % = share of the first bar in its group.
            {data.startsAtRegistered
              ? ' With a country filter the steps start at "Registered": we only learn the country from the phone number at registration.'
              : ' We can only tell a new account from someone logging back into an existing one once the phone number is verified, so the first two bars include both; installs that stopped before verifying can’t be told apart.'}
          </>
        }
        table={{
          headers: ['Step', 'Installs'],
          rows: Array.map(steps, (step) => [
            step.label,
            formatValue.count(step.count),
          ]),
        }}
      >
        <div className="space-y-4">
          {Array.isNonEmptyReadonlyArray(data.anyAccountSteps) ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                All installs (new and existing accounts)
              </p>
              <StepBars steps={data.anyAccountSteps} />
            </div>
          ) : null}
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              New accounts only
            </p>
            <StepBars steps={data.newAccountSteps} />
          </div>
        </div>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Contact import"
          population="client"
          cohorts={data.cohorts}
          note="% of new registrations, by how the contact import ended."
          table={seriesTable(
            SHARE_SERIES,
            data.contactsImport,
            'pct',
            'Contact import'
          )}
        >
          <BucketBarChart
            series={SHARE_SERIES}
            points={data.contactsImport}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title="New registrations"
          population="backend"
          note="New accounts created per period, counted on our servers. Not comparable with the onboarding steps, which cover only installs with analytics on."
          table={seriesTable(USERS_SERIES, data.registrations, 'count')}
        >
          <TimeSeriesChart
            series={USERS_SERIES}
            points={data.registrations}
            format="count"
          />
        </ChartCard>
        <ChartCard
          title={`Activation rate by ${filters.period} of first open`}
          population="client"
          note={`% of new registrations that activated, grouped by the ${filters.period} they first opened the app. A ${filters.period} shows up ${data.cohortWaitDays} days after it ends, once every install in it has had its full time to activate.`}
          table={seriesTable(ACTIVATION_SERIES, data.activationTrend, 'pct')}
        >
          {Array.isNonEmptyReadonlyArray(data.activationTrend) ? (
            <TimeSeriesChart
              series={ACTIVATION_SERIES}
              points={data.activationTrend}
              format="pct"
            />
          ) : (
            <p className="text-xs text-gray-500">
              Nothing to show yet. Pick a longer range or a shorter period.
            </p>
          )}
        </ChartCard>
        <ChartCard
          title="Activation by offers seen on the first marketplace visit"
          population="client"
          cohorts={data.cohorts}
          note="New registrations that imported contacts, grouped by how many main-marketplace offers loaded the first time they opened the marketplace; each bar is the % of that group that activated. We record what loaded, not whether they looked at it."
        >
          <BucketBarChart
            series={ACTIVATED_SERIES}
            points={data.activationByOffersSeen}
            format="pct"
          />
          <div className="mt-3">
            <DataTable data={data.offersSeenTable} />
          </div>
        </ChartCard>
        <ChartCard
          title="Time from first open to registration"
          population="client"
          cohorts={data.cohorts}
          note="% of new registrations, by how long after first opening the app they registered."
          table={seriesTable(
            SHARE_SERIES,
            data.timeToRegistration,
            'pct',
            'Time to register'
          )}
        >
          <BucketBarChart
            series={SHARE_SERIES}
            points={data.timeToRegistration}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title="Time from registration to activation"
          population="client"
          cohorts={data.cohorts}
          note="% of activated installs, by how long after registering they created their first offer or sent their first request."
          table={seriesTable(
            SHARE_SERIES,
            data.timeToActivation,
            'pct',
            'Time to activate'
          )}
        >
          <BucketBarChart
            series={SHARE_SERIES}
            points={data.timeToActivation}
            format="pct"
          />
        </ChartCard>
      </div>
    </div>
  )
}
