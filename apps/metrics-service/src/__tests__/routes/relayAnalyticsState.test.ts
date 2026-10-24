import {dayOf, isoWeekStart} from '@vexl-next/analytics-definitions/src/buckets'
import {DayString} from '@vexl-next/analytics-definitions/src/core'
import {
  encapsulateRequest,
  generateGatewayKey,
} from '@vexl-next/cryptography/src/operations/ohttp'
import {
  encodeRelayedAnalyticsState,
  InvalidAnalyticsStateError,
} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Schema} from 'effect'
import {
  clearStoredStates,
  daysAgo,
  iosClientWithPrefix,
  newStateId,
  readStoredStates,
  relayRequest,
  testGatewayKeyConfig,
  testJourneyUpsert,
  upsertState,
} from '../utils/analyticsStates'

import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const DAY_MS = 24 * 60 * 60 * 1000
const daysBefore = (day: DayString, days: number): DayString =>
  dayOf(new Date(Date.parse(day) - days * DAY_MS))

const thisMonday = isoWeekStart(new Date())
const lastWeekMonday = daysBefore(thisMonday, 7)
const lastWeekWednesday = daysBefore(thisMonday, 5)

const cohortStartedLastWednesday = testJourneyUpsert({
  name: 'testWeekJourney',
  startDay: lastWeekWednesday,
  updatedDay: lastWeekWednesday,
  payload: {},
})

beforeEach(async () => {
  await runPromiseInMockedEnvironment(clearStoredStates)
})

describe('relayAnalyticsState', () => {
  it('accepts a weekly update rounded before the registration day', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const updatedDay = isoWeekStart(new Date(daysAgo(7)))
        const startDay = dayOf(
          new Date(Date.parse(updatedDay) + 6 * 24 * 60 * 60 * 1000)
        )
        const request = testJourneyUpsert({
          name: 'testWeekJourney',
          startDay,
          updatedDay,
          payload: {},
        })

        yield* _(upsertState(request))
        expect(yield* _(readStoredStates)).toMatchObject([
          {name: 'testWeekJourney', startDay, updatedDay, payload: {}},
        ])
      })
    )
  })

  it('rejects a weekly update from before the registration week', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.either(
            upsertState(
              testJourneyUpsert({
                name: 'testWeekJourney',
                updatedDay: isoWeekStart(new Date(daysAgo(7))),
                payload: {},
              })
            )
          )
        )
        expectErrorResponse(InvalidAnalyticsStateError)(result)
      })
    )
  })

  it('rejects a future registration even with a weekly update in the past', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.either(
            upsertState(
              testJourneyUpsert({
                name: 'testWeekJourney',
                startDay: daysAgo(-2),
                updatedDay: isoWeekStart(new Date()),
                payload: {},
              })
            )
          )
        )
        expectErrorResponse(InvalidAnalyticsStateError)(result)
      })
    )
  })

  it('stores a valid journey with platform, release line and country prefix', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const request = testJourneyUpsert({revision: 2})
        yield* _(upsertState(request))

        const stored = yield* _(readStoredStates)
        expect(stored).toHaveLength(1)
        expect(stored[0]).toMatchObject({
          id: request.id,
          kind: 'journey',
          name: 'testJourney',
          schemaVersion: 1,
          revision: 2,
          startDay: request.startDay,
          updatedDay: request.updatedDay,
          payload: {step: 'opened'},
          appPlatform: 'IOS',
          appMajorVersion: '26.9',
          countryPrefix: '420',
        })
      })
    )
  })

  it('replaces the payload when the revision is higher', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const first = testJourneyUpsert({revision: 1})
        yield* _(upsertState(first))
        yield* _(
          upsertState({
            ...first,
            revision: 2,
            payload: {step: 'registered', reLogin: true},
          })
        )

        const stored = yield* _(readStoredStates)
        expect(stored).toHaveLength(1)
        expect(stored[0]).toMatchObject({
          revision: 2,
          payload: {step: 'registered', reLogin: true},
        })
      })
    )
  })

  it('ignores an upsert with a lower revision', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const latest = testJourneyUpsert({
          revision: 5,
          payload: {step: 'registered'},
        })
        yield* _(upsertState(latest))
        yield* _(
          upsertState({...latest, revision: 3, payload: {step: 'intro'}})
        )

        const stored = yield* _(readStoredStates)
        expect(stored).toHaveLength(1)
        expect(stored[0]).toMatchObject({
          revision: 5,
          payload: {step: 'registered'},
        })
      })
    )
  })

  it.each([
    ['unknown name', testJourneyUpsert({name: 'nope'})],
    ['unknown schema version', testJourneyUpsert({schemaVersion: 2})],
    [
      'excess payload property',
      testJourneyUpsert({payload: {step: 'opened', extra: true}}),
    ],
    ['invalid payload value', testJourneyUpsert({payload: {step: 'nope'}})],
    [
      'stale start day',
      testJourneyUpsert({startDay: daysAgo(15), updatedDay: daysAgo(15)}),
    ],
    [
      'updated day before start day',
      testJourneyUpsert({startDay: daysAgo(1), updatedDay: daysAgo(2)}),
    ],
    [
      'updated day too far in the future',
      testJourneyUpsert({startDay: daysAgo(0), updatedDay: daysAgo(-2)}),
    ],
    [
      'malformed day',
      testJourneyUpsert({
        startDay: Schema.decodeSync(DayString)('2026-02-30'),
        updatedDay: daysAgo(0),
      }),
    ],
  ])('rejects %s with 400 and stores nothing', async (_label, request) => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const result = yield* _(Effect.either(upsertState(request)))
        expectErrorResponse(InvalidAnalyticsStateError)(result)
        expect(yield* _(readStoredStates)).toHaveLength(0)
      })
    )
  })

  it('stores a week precision journey started mid-week and its update in a later week', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(upsertState(cohortStartedLastWednesday))
        expect(yield* _(readStoredStates)).toMatchObject([
          {
            name: 'testWeekJourney',
            revision: 0,
            startDay: lastWeekWednesday,
            updatedDay: lastWeekWednesday,
            payload: {},
          },
        ])

        yield* _(
          upsertState({
            ...cohortStartedLastWednesday,
            revision: 1,
            updatedDay: thisMonday,
            payload: {activatedBy: 'offer', activationClass: 'main'},
          })
        )
        expect(yield* _(readStoredStates)).toMatchObject([
          {
            revision: 1,
            startDay: lastWeekWednesday,
            updatedDay: thisMonday,
            payload: {activatedBy: 'offer', activationClass: 'main'},
          },
        ])
      })
    )
  })

  it('accepts a start day at the edge of lifetime plus grace', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(
          upsertState(
            testJourneyUpsert({startDay: daysAgo(14), updatedDay: daysAgo(0)})
          )
        )
        expect(yield* _(readStoredStates)).toHaveLength(1)
      })
    )
  })

  it('rejects a kind mismatch on an existing id with 400', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const journey = testJourneyUpsert({revision: 1})
        yield* _(upsertState(journey))

        const result = yield* _(
          Effect.either(
            upsertState({
              ...journey,
              kind: 'aggregation',
              name: 'testAggregation',
              startDay: thisMonday,
              revision: 2,
              payload: {marketplaceOpened: 1, firstLoadResult: 'offers'},
            })
          )
        )
        expectErrorResponse(InvalidAnalyticsStateError)(result)

        const stored = yield* _(readStoredStates)
        expect(stored).toHaveLength(1)
        expect(stored[0]).toMatchObject({kind: 'journey', revision: 1})
      })
    )
  })

  it('rejects a name mismatch on an existing id with 400', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const journey = testJourneyUpsert({revision: 1})
        yield* _(upsertState(journey))

        const result = yield* _(
          Effect.either(
            upsertState({
              ...journey,
              name: 'testWeekJourney',
              revision: 2,
              payload: {activatedBy: 'offer'},
            })
          )
        )
        expectErrorResponse(InvalidAnalyticsStateError)(result)
        expect(yield* _(readStoredStates)).toHaveLength(1)
      })
    )
  })

  it('stores an aggregation inside its settle period and rejects one past it', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        // Week buckets start on Mondays: 14 to 20 days ago is inside, 21 to 27 past.
        const inSettle = testJourneyUpsert({
          id: newStateId(),
          kind: 'aggregation',
          name: 'testAggregation',
          startDay: isoWeekStart(new Date(daysAgo(14))),
          updatedDay: daysAgo(14),
          payload: {marketplaceOpened: 3, firstLoadResult: 'offers'},
        })
        yield* _(upsertState(inSettle))

        const result = yield* _(
          Effect.either(
            upsertState({
              ...inSettle,
              id: newStateId(),
              startDay: isoWeekStart(new Date(daysAgo(21))),
              updatedDay: daysAgo(21),
            })
          )
        )
        expectErrorResponse(InvalidAnalyticsStateError)(result)
        expect(yield* _(readStoredStates)).toHaveLength(1)
      })
    )
  })

  it('rejects an aggregation whose start day is not its period start', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.either(
            upsertState(
              testJourneyUpsert({
                kind: 'aggregation',
                name: 'testAggregation',
                startDay: daysBefore(thisMonday, 1),
                updatedDay: daysAgo(0),
                payload: {marketplaceOpened: 1, firstLoadResult: 'offers'},
              })
            )
          )
        )
        expectErrorResponse(InvalidAnalyticsStateError)(result)
        expect(yield* _(readStoredStates)).toHaveLength(0)
      })
    )
  })

  it('rejects a state whose kind differs from its definition', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.either(upsertState(testJourneyUpsert({kind: 'aggregation'})))
        )
        expectErrorResponse(InvalidAnalyticsStateError)(result)
        expect(yield* _(readStoredStates)).toHaveLength(0)
      })
    )
  })

  it('rejects a body over the size cap with 413 before parsing', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.either(
            upsertState(testJourneyUpsert({payload: {step: 'x'.repeat(5000)}}))
          )
        )
        expect(result).toMatchObject({
          _tag: 'Left',
          left: {_tag: 'ResponseError', response: {status: 413}},
        })
        expect(yield* _(readStoredStates)).toHaveLength(0)
      })
    )
  })

  describe('gateway', () => {
    const encapsulatedOnboarding = encapsulateRequest({
      keyConfig: testGatewayKeyConfig,
      plaintext: encodeRelayedAnalyticsState({
        client: iosClientWithPrefix,
        state: testJourneyUpsert(),
      }),
    })

    it('answers 503 for a key the gateway does not hold, so the client retries', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const {keyConfig} = yield* _(generateGatewayKey(3))
          const request = yield* _(
            encapsulateRequest({
              keyConfig,
              plaintext: encodeRelayedAnalyticsState({
                client: iosClientWithPrefix,
                state: testJourneyUpsert(),
              }),
            })
          )
          const result = yield* _(Effect.either(relayRequest(request)))
          expect(result).toMatchObject({
            _tag: 'Left',
            left: {_tag: 'AnalyticsGatewayKeyUnavailableError'},
          })
        })
      )
    })

    it('rejects a tampered request with 400', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const request = yield* _(encapsulatedOnboarding)
          request[request.length - 1] = (request[request.length - 1] ?? 0) ^ 1
          const result = yield* _(Effect.either(relayRequest(request)))
          expectErrorResponse(InvalidAnalyticsStateError)(result)
          expect(yield* _(readStoredStates)).toHaveLength(0)
        })
      )
    })

    it('rejects a decrypted body that is not a relayed state with 400', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const request = yield* _(
            encapsulateRequest({
              keyConfig: testGatewayKeyConfig,
              plaintext: new TextEncoder().encode('{"state":{}}'),
            })
          )
          const result = yield* _(Effect.either(relayRequest(request)))
          expectErrorResponse(InvalidAnalyticsStateError)(result)
        })
      )
    })
  })
})
