import {Effect} from 'effect'
import {expireAnalyticsStatesTask} from '../analyticsExpiryWorker'
import {
  clearStoredStates,
  daysAgo,
  insertStoredState,
  newStateId,
  readStoredStates,
} from './utils/analyticsStates'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

beforeEach(async () => {
  await runPromiseInMockedEnvironment(clearStoredStates)
})

describe('expireAnalyticsStatesTask', () => {
  it('nulls expired ids per definition and deletes rows past retention', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const liveJourney = newStateId()
        const expiredJourney = newStateId()
        const liveBucket = newStateId()
        const expiredBucket = newStateId()

        const rows: Array<Parameters<typeof insertStoredState>[0]> = [
          {
            id: liveJourney,
            kind: 'journey',
            name: 'onboarding',
            startDay: daysAgo(14),
          },
          {
            id: expiredJourney,
            kind: 'journey',
            name: 'onboarding',
            startDay: daysAgo(15),
          },
          {
            id: liveBucket,
            kind: 'aggregation',
            name: 'marketplaceWeekly',
            startDay: daysAgo(20),
          },
          {
            id: expiredBucket,
            kind: 'aggregation',
            name: 'marketplaceWeekly',
            startDay: daysAgo(21),
          },
          {
            id: null,
            kind: 'journey',
            name: 'onboarding',
            startDay: daysAgo(541),
          },
        ]
        yield* _(Effect.forEach(rows, insertStoredState))

        yield* _(expireAnalyticsStatesTask)

        const stored = yield* _(readStoredStates)
        expect(stored.map((row) => [row.startDay, row.id])).toEqual([
          [daysAgo(14), liveJourney],
          [daysAgo(15), null],
          [daysAgo(20), liveBucket],
          [daysAgo(21), null],
        ])
      })
    )
  })
})
