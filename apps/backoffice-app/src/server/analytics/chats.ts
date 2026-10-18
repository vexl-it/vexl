import {type ChatsData} from '@/src/services/analytics/domain'
import {type RequestClass} from '@vexl-next/analytics-definitions/src/coreAction'
import {
  requestJourney,
  type RequestState,
} from '@vexl-next/analytics-definitions/src/definitions/request'
import {Array, Effect} from 'effect'
import {
  addDays,
  bucketsOf,
  daysOf,
  rangeStartDay,
  snapshotOf,
  today,
} from './buckets'
import {
  countStates,
  sumMetric,
  sumValues,
  sumWhere,
  type MetricValue,
  type QueryResult,
  type QueryScope,
} from './query'
import {countOrNull, inBucket, percentOrNull, seriesOf} from './stats'

const REQUEST_CLASSES: ReadonlyArray<readonly [string, RequestClass]> = [
  ['Main marketplace', 'main'],
  ['Clubs', 'club'],
]

const isPositive = (value: MetricValue): boolean => value.key === 'true'

export const loadChats = (scope: QueryScope): QueryResult<ChatsData> =>
  Effect.gen(function* (_) {
    const {filters} = scope
    const snapshot = snapshotOf(
      filters.range,
      'requests sent',
      requestJourney.lifetimeDays
    )
    const backendBuckets = bucketsOf(filters, 'backend')
    const ratingsOf = (days: ReturnType<typeof daysOf>, withPeriod: boolean) =>
      sumMetric({
        name: 'TRADE_FEEDBACK_SUBMITTED',
        by: 'positive',
        days,
        period: withPeriod ? filters.period : undefined,
        dimensions: {country: 'clientCountryPrefix', platform: 'appPlatform'},
        scope,
      })

    const data = yield* _(
      Effect.all(
        {
          requests: countStates(requestJourney.name, {
            state: requestJourney.payloadSchema.pick(
              'class',
              'outcome',
              'bothWrote'
            ),
            days: snapshot.days,
            scope,
          }),
          ratings: ratingsOf(daysOf(backendBuckets), true),
          rangeRatings: ratingsOf(
            {from: rangeStartDay(filters.range), to: addDays(today(), 1)},
            false
          ),
        },
        {concurrency: 'unbounded'}
      )
    )

    return {
      conversations: Array.map(REQUEST_CLASSES, ([label, requestClass]) => {
        const sent = (
          predicate: (state: Partial<RequestState>) => boolean
        ): number | null =>
          countOrNull(
            sumWhere(
              data.requests,
              (row) => row.state.class === requestClass && predicate(row.state)
            )
          )
        return {
          label,
          steps: [
            {label: 'Request sent', count: sent(() => true)},
            {
              label: 'Request approved',
              count: sent((state) => state.outcome === 'approved'),
            },
            {
              label: 'Both sides wrote',
              count: sent(
                (state) =>
                  state.outcome === 'approved' && state.bothWrote === true
              ),
            },
          ],
        }
      }),
      cohorts: snapshot.cohorts,
      ratings: seriesOf(backendBuckets, (bucket) => ({
        submitted: countOrNull(sumValues(data.ratings, inBucket(bucket))),
        positive: countOrNull(
          sumValues(
            data.ratings,
            (value) => inBucket(bucket)(value) && isPositive(value)
          )
        ),
      })),
      positiveRate: percentOrNull(
        sumValues(data.rangeRatings, isPositive),
        sumValues(data.rangeRatings)
      ),
    }
  })
