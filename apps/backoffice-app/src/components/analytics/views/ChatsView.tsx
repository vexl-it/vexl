'use client'

import {type ChatsData, formatValue} from '@/src/services/analytics/domain'
import {Array} from 'effect'
import {CHART_BLUE, CHART_NEUTRAL} from '../../chartTheme'
import {
  ChartCard,
  StatTile,
  StepBars,
  TimeSeriesChart,
  seriesTable,
} from '../charts'
import {ViewData} from '../ViewData'

const RATING_SERIES = [
  {key: 'submitted', label: 'Ratings submitted', color: CHART_NEUTRAL},
  {key: 'positive', label: 'Positive (4–5★)', color: CHART_BLUE},
]

export function ChatsView() {
  return <ViewData view="chats">{(data) => <Chats data={data} />}</ViewData>
}

function Chats({data}: {data: ChatsData}) {
  return (
    <div className="space-y-4">
      <ChartCard
        title="From request to conversation"
        population="client"
        cohorts={data.cohorts}
        note="Requests sent, followed for 14 days on the sender's phone: was the request approved, and did both sides then write at least one message? % = share of requests sent. Clubs = the offer reached the sender only through a Club."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {Array.map(data.conversations, (conversation) => (
            <div key={conversation.label}>
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                {conversation.label}
              </p>
              <StepBars steps={conversation.steps} />
            </div>
          ))}
        </div>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatTile
          label="Positive chat ratings (4–5★)"
          value={formatValue.pct(data.positiveRate)}
          population="backend"
          hint="% of ratings left after a chat that gave 4 or 5 stars. It rates the chat, not whether a trade happened."
        />
        <ChartCard
          title="Post-chat ratings"
          population="backend"
          note="Ratings users left after a chat, counted on our servers since the server started recording them. Not comparable with the funnel above, which covers only installs with analytics on."
          table={seriesTable(RATING_SERIES, data.ratings, 'count')}
          className="lg:col-span-2"
        >
          <TimeSeriesChart
            series={RATING_SERIES}
            points={data.ratings}
            format="count"
          />
        </ChartCard>
      </div>
    </div>
  )
}
