'use client'

import {formatValue, type LiquidityData} from '@/src/services/analytics/domain'
import {Array, Option, pipe} from 'effect'
import {
  CHART_BLUE,
  CHART_NEUTRAL,
  CHART_ORANGE,
  CHART_RED,
} from '../../chartTheme'
import {
  BucketBarChart,
  ChartCard,
  DataTable,
  StatTile,
  TimeSeriesChart,
  seriesTable,
  type ChartSeries,
} from '../charts'
import {ViewData} from '../ViewData'

const OFFER_TYPE_SERIES = [
  {key: 'buy', label: 'Buy', color: CHART_BLUE},
  {key: 'sell', label: 'Sell', color: CHART_ORANGE},
]
const OUTCOME_SERIES = [
  {key: 'approved', label: 'Approved', color: CHART_BLUE},
  {key: 'rejected', label: 'Rejected', color: CHART_ORANGE},
  {key: 'cancelled', label: 'Cancelled', color: CHART_RED},
  {key: 'noResponse', label: 'No answer within 14 days', color: CHART_NEUTRAL},
]
const SENT_SERIES = [{key: 'sent', label: 'Sent', color: CHART_NEUTRAL}]
const MARKETPLACE_SERIES = [
  {key: 'main', label: 'Main marketplace', color: CHART_BLUE},
  {key: 'club', label: 'Clubs', color: CHART_ORANGE},
]
// Countries come largest first in both charts, so a country keeps its color;
// a single picked country is blue
const COUNTRY_COLORS = [CHART_BLUE, CHART_ORANGE, CHART_RED]

const withColors = (
  items: ReadonlyArray<{key: string; label: string}>
): ChartSeries[] => {
  const countries = Array.filter(items, (item) => item.key !== 'all')
  return Array.map(items, (item) => ({
    ...item,
    color:
      item.key === 'all'
        ? CHART_NEUTRAL
        : pipe(
            Array.findFirstIndex(countries, (country) => country === item),
            Option.flatMap((index) => Array.get(COUNTRY_COLORS, index)),
            Option.getOrElse(() => CHART_BLUE)
          ),
  }))
}

export function LiquidityView() {
  return (
    <ViewData view="liquidity">{(data) => <Liquidity data={data} />}</ViewData>
  )
}

function Liquidity({data}: {data: LiquidityData}) {
  const visibilitySeries = withColors(data.medianVisibility.countries)
  const emptySeries = withColors(data.emptyMarketplace.countries)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active offers now"
          value={formatValue.count(data.activeOffersNow)}
          population="backend"
          scope="noPlatform"
          hint="Offers currently live in the marketplace."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Installs that saw no main-marketplace offers, per week"
          population="client"
          className="lg:col-span-2"
          note="% of installs that opened the marketplace that week and had no main-marketplace offers to see. All countries shows the three largest markets next to the total."
          table={seriesTable(emptySeries, data.emptyMarketplace.points, 'pct')}
        >
          <TimeSeriesChart
            series={emptySeries}
            points={data.emptyMarketplace.points}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title={`Offers seen in the main marketplace, by country · week of ${data.lastSettledWeek}`}
          population="client"
          note="Installs grouped by how many main-marketplace offers loaded on their first marketplace visit that week; cells are % of the country's installs. We record what loaded, not whether the user looked at it. Countries with fewer than 20 installs show <20 and no percentages."
        >
          <DataTable data={data.visibleByCountry} />
        </ChartCard>
        <ChartCard
          title="Offers created"
          population="backend"
          note="New buy and sell offers per period, counted on our servers."
          table={seriesTable(OFFER_TYPE_SERIES, data.offersCreated, 'count')}
        >
          <BucketBarChart
            series={OFFER_TYPE_SERIES}
            points={data.offersCreated}
            format="count"
            stacked
          />
        </ChartCard>
        <ChartCard
          title="Active offers by type"
          population="backend"
          scope="noPlatform"
          note="Buy and sell offers live in the marketplace at the end of each period."
          table={seriesTable(OFFER_TYPE_SERIES, data.activeOffers, 'count')}
        >
          <TimeSeriesChart
            series={OFFER_TYPE_SERIES}
            points={data.activeOffers}
            format="count"
          />
        </ChartCard>
        <ChartCard
          title="How many users an offer reaches (median)"
          population="backend"
          scope="noPlatform"
          note="How many users a live offer is shown to, at the end of each period: half of the offers reach more, half fewer. Medians can't be combined across countries, so All countries shows the three largest markets and Other shows nothing."
          table={seriesTable(
            visibilitySeries,
            data.medianVisibility.points,
            'count'
          )}
        >
          {Array.isNonEmptyArray(visibilitySeries) ? (
            <TimeSeriesChart
              series={visibilitySeries}
              points={data.medianVisibility.points}
              format="count"
            />
          ) : (
            <p className="text-xs text-gray-500">
              Other combines several small countries, so it has no single
              median. Pick a specific country.
            </p>
          )}
        </ChartCard>
        <ChartCard
          title="Requests sent"
          population="backend"
          note="Requests sent per period, counted on our servers. What happened to them is in Request outcome below."
          table={seriesTable(SENT_SERIES, data.requestsSent, 'count')}
        >
          <TimeSeriesChart
            series={SENT_SERIES}
            points={data.requestsSent}
            format="count"
          />
        </ChartCard>
        <ChartCard
          title="Time from request to response"
          population="client"
          cohorts={data.requestCohorts}
          note="% of sent requests, by how long until the offer owner approved or rejected it. We follow each request for 14 days. Clubs = the offer reached the sender only through a Club."
          table={seriesTable(
            MARKETPLACE_SERIES,
            data.timeToResponse,
            'pct',
            'Time to answer'
          )}
        >
          <BucketBarChart
            series={MARKETPLACE_SERIES}
            points={data.timeToResponse}
            format="pct"
          />
        </ChartCard>
        <ChartCard
          title="Request outcome"
          population="client"
          className="lg:col-span-2"
          note="What happened to the requests sent in each period, as % of them, reported by the sender's app. Clubs = the offer reached the sender only through a Club. A request with no answer within 14 days counts as No answer, so recent periods stay faded for about 3 weeks."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {Array.map(data.requestOutcomes, (outcome) => (
              <div key={outcome.label}>
                <p className="mb-1 text-xs font-medium text-gray-500">
                  {outcome.label}
                </p>
                <BucketBarChart
                  series={OUTCOME_SERIES}
                  points={outcome.points}
                  format="pct"
                  stacked
                />
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard
          title="Time from offer creation to first request"
          population="client"
          className="lg:col-span-2"
          cohorts={data.offerCohorts}
          note="% of new offers, by how long until the first request arrived. We follow each offer for 30 days; offers deleted before any request are left out. Every offer reaches the creator's contacts; some are also shared to Clubs."
        >
          <DataTable data={data.timeToFirstRequest} />
        </ChartCard>
      </div>
    </div>
  )
}
