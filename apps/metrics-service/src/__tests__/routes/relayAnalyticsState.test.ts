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
  onboardingUpsert,
  readStoredStates,
  relayRequest,
  testGatewayKeyConfig,
  testRelayToken,
  upsertState,
} from '../utils/analyticsStates'

import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const DAY_MS = 24 * 60 * 60 * 1000
const daysBefore = (day: DayString, days: number): DayString =>
  dayOf(new Date(Date.parse(day) - days * DAY_MS))

const thisMonday = isoWeekStart(new Date())
const lastWeekMonday = daysBefore(thisMonday, 7)
const lastWeekWednesday = daysBefore(thisMonday, 5)

const cohortStartedLastWednesday = onboardingUpsert({
  name: 'registrationCohort',
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
        const request = onboardingUpsert({
          name: 'registrationCohort',
          startDay,
          updatedDay,
          payload: {},
        })

        yield* _(upsertState(request))
        expect(yield* _(readStoredStates)).toMatchObject([
          {name: 'registrationCohort', startDay, updatedDay, payload: {}},
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
              onboardingUpsert({
                name: 'registrationCohort',
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
              onboardingUpsert({
                name: 'registrationCohort',
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
        const request = onboardingUpsert({revision: 2})
        yield* _(upsertState(request))

        const stored = yield* _(readStoredStates)
        expect(stored).toHaveLength(1)
        expect(stored[0]).toMatchObject({
          id: request.id,
          kind: 'journey',
          name: 'onboarding',
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
        const first = onboardingUpsert({revision: 1})
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
        const latest = onboardingUpsert({
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
    ['unknown name', onboardingUpsert({name: 'nope'})],
    ['unknown schema version', onboardingUpsert({schemaVersion: 2})],
    [
      'excess payload property',
      onboardingUpsert({payload: {step: 'opened', extra: true}}),
    ],
    ['invalid payload value', onboardingUpsert({payload: {step: 'nope'}})],
    [
      'stale start day',
      onboardingUpsert({startDay: daysAgo(15), updatedDay: daysAgo(15)}),
    ],
    [
      'updated day before start day',
      onboardingUpsert({startDay: daysAgo(1), updatedDay: daysAgo(2)}),
    ],
    [
      'updated day too far in the future',
      onboardingUpsert({startDay: daysAgo(0), updatedDay: daysAgo(-2)}),
    ],
    [
      'malformed day',
      onboardingUpsert({
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
            name: 'registrationCohort',
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
            onboardingUpsert({startDay: daysAgo(14), updatedDay: daysAgo(0)})
          )
        )
        expect(yield* _(readStoredStates)).toHaveLength(1)
      })
    )
  })

  it('rejects a kind mismatch on an existing id with 400', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const journey = onboardingUpsert({revision: 1})
        yield* _(upsertState(journey))

        const result = yield* _(
          Effect.either(
            upsertState({
              ...journey,
              kind: 'aggregation',
              name: 'marketplaceWeekly',
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
        const journey = onboardingUpsert({revision: 1})
        yield* _(upsertState(journey))

        const result = yield* _(
          Effect.either(
            upsertState({
              ...journey,
              name: 'registrationCohort',
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
        const inSettle = onboardingUpsert({
          id: newStateId(),
          kind: 'aggregation',
          name: 'marketplaceWeekly',
          startDay: daysAgo(20),
          updatedDay: daysAgo(14),
          payload: {marketplaceOpened: 3, firstLoadResult: 'offers'},
        })
        yield* _(upsertState(inSettle))

        const result = yield* _(
          Effect.either(
            upsertState({
              ...inSettle,
              id: newStateId(),
              startDay: daysAgo(21),
              updatedDay: daysAgo(15),
            })
          )
        )
        expectErrorResponse(InvalidAnalyticsStateError)(result)
        expect(yield* _(readStoredStates)).toHaveLength(1)
      })
    )
  })

  it('rejects a body over the size cap with 413 before parsing', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.either(
            upsertState(onboardingUpsert({payload: {step: 'x'.repeat(5000)}}))
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
        state: onboardingUpsert(),
      }),
    })

    it.each([
      ['without a relay token', undefined],
      ['with an unknown relay token', 'not-a-relay'],
    ])('rejects a request %s with 403', async (_label, relayToken) => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const request = yield* _(encapsulatedOnboarding)
          const result = yield* _(
            Effect.either(relayRequest(request, relayToken))
          )
          expect(result).toMatchObject({
            _tag: 'Left',
            left: {_tag: 'UnknownAnalyticsRelayError'},
          })
          expect(yield* _(readStoredStates)).toHaveLength(0)
        })
      )
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
                state: onboardingUpsert(),
              }),
            })
          )
          const result = yield* _(
            Effect.either(relayRequest(request, testRelayToken))
          )
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
          const result = yield* _(
            Effect.either(relayRequest(request, testRelayToken))
          )
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
          const result = yield* _(
            Effect.either(relayRequest(request, testRelayToken))
          )
          expectErrorResponse(InvalidAnalyticsStateError)(result)
        })
      )
    })
  })
})
