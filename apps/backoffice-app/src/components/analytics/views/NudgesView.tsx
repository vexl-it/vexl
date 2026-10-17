'use client'

import {type NudgesData} from '@/src/services/analytics/domain'
import {CHART_BLUE} from '../../chartTheme'
import {ChartCard, DataTable, TimeSeriesChart, seriesTable} from '../charts'
import {ViewData} from '../ViewData'

const ALLOWED_SERIES = [
  {key: 'allowed', label: 'Notifications allowed', color: CHART_BLUE},
]

export function NudgesView() {
  return <ViewData view="nudges">{(data) => <Nudges data={data} />}</ViewData>
}

function Nudges({data}: {data: NudgesData}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <ChartCard
          title="Push notifications sent"
          population="backend"
          scope="noCountry"
          note={`Push notifications our servers sent ${data.sentSpan}, by type. We can't reliably tell whether they were delivered. Notifications sent before the servers recorded the type are not counted.`}
        >
          <DataTable data={data.pushSent} />
        </ChartCard>
        <ChartCard
          title="Notification opens"
          population="client"
          cohorts={data.openCohorts}
          note="Notifications opened, by type; reminders and news first. → columns: % of opens followed by that action on the same day. — = chat notifications open the chat themselves, so Chat opened says nothing there. These types don't match the sent table, so there is no open rate. Inactivity reminder: not available yet; until the app labels them they count as Other."
        >
          <DataTable data={data.opens} />
        </ChartCard>
      </div>

      <ChartCard
        title="In-app prompts"
        population="client"
        cohorts={data.promptCohorts}
        note="A prompt counts once from when it first appears until it is closed, tapped or 7 days pass, even if it shows again in between. Columns are % of prompts shown; Did it within 7 days = the user did what the prompt asks (imported contacts, allowed notifications, created an offer, …)."
      >
        <DataTable data={data.prompts} />
      </ChartCard>

      <ChartCard
        title="Share of weekly active installs with notifications allowed"
        population="client"
        note="Installs that opened the app that week: % that had notifications allowed in the phone settings when they first opened it that week."
        table={seriesTable(ALLOWED_SERIES, data.notificationsAllowed, 'pct')}
      >
        <TimeSeriesChart
          series={ALLOWED_SERIES}
          points={data.notificationsAllowed}
          format="pct"
        />
      </ChartCard>
    </div>
  )
}
