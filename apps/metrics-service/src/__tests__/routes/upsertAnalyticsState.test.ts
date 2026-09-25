import {DayString} from '@vexl-next/analytics-definitions/src/core'
import {InvalidAnalyticsStateError} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Schema} from 'effect'
import {
  clearStoredStates,
  daysAgo,
  newStateId,
  onboardingUpsert,
  readStoredStates,
  upsertState,
} from '../utils/analyticsStates'

import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

beforeEach(async () => {
  await runPromiseInMockedEnvironment(clearStoredStates)
})

describe('upsertAnalyticsState', () => {
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
})
