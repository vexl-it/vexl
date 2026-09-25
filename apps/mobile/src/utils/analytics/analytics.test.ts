import {dayOf, isoWeekStart} from '@vexl-next/analytics-definitions/src/buckets'
import {AnalyticsStateId} from '@vexl-next/analytics-definitions/src/core'
import {
  marketplaceWeeklyAggregation,
  type MarketplaceWeeklyState,
} from '@vexl-next/analytics-definitions/src/definitions/marketplaceWeekly'
import {onboardingJourney} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {registrationCohortJourney} from '@vexl-next/analytics-definitions/src/definitions/registrationCohort'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Deferred, Effect, Option, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import clearMmkvStorageAndEmptyAtoms from '../clearMmkvStorageAndEmptyAtoms'
import {storage} from '../mmkv/effectMmkv'
import {
  analyticsEnabledAtom,
  analyticsInstancesAtom,
  analyticsMarkersAtom,
  setAnalyticsInstancesAtom,
  setAnalyticsMarkersAtom,
} from './atoms'
import {type AnalyticsInstance} from './domain'
import {flushAnalyticsActionAtom} from './flush'
import {
  applyAggregationUpdate,
  applyJourneyStep,
  bucketStartDay,
  findAggregationBucket,
  pendingUploads,
  pruneSettledExpired,
  settleInstance,
} from './instances'
import {journeyReportActionAtom} from './report'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))
jest.mock('../reportError', () => ({__esModule: true, default: jest.fn()}))
jest.mock('../mmkv/mmkvDataLossDiagnosticStorage', () => ({
  recordCriticalMmkvKeyPersisted: jest.fn(async () => undefined),
  clearMmkvDataLossDiagnostics: jest.fn(
    async (clear: () => void): Promise<void> => {
      clear()
    }
  ),
}))
jest.mock('../preferences', () => ({
  preferencesAtom: jest.requireActual('jotai').atom({analyticsEnabled: true}),
}))

const mockUpsertAnalyticsState = jest.fn()
jest.mock('../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom({
    metrics: {
      upsertAnalyticsState: (request: unknown) =>
        mockUpsertAnalyticsState(request),
    },
  }),
}))

const id = (n: number): AnalyticsStateId =>
  Schema.decodeSync(AnalyticsStateId)(
    `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
  )
let nextId = 1
const newId = (): AnalyticsStateId => id(nextId++)

const monday = new Date('2026-09-21T10:00:00Z')
const wednesday = new Date('2026-09-23T10:00:00Z')
const nextMonday = new Date('2026-09-28T10:00:00Z')
const eightDaysLater = new Date('2026-09-29T10:00:00Z')

const someInstance = (
  overrides: Partial<AnalyticsInstance> = {}
): AnalyticsInstance => ({
  id: id(99),
  kind: 'journey',
  name: 'onboarding',
  schemaVersion: 1,
  revision: 3,
  startDay: dayOf(monday),
  updatedDay: dayOf(monday),
  payload: {step: 'intro'},
  closed: false,
  pending: true,
  ...overrides,
})

const openOnboarding = (): AnalyticsInstance =>
  Option.getOrThrow(
    applyJourneyStep({
      definition: onboardingJourney,
      current: Option.none(),
      partial: {step: 'opened'},
      now: monday,
      newId,
    })
  )

const store = getDefaultStore()

beforeEach(() => {
  nextId = 1
  mockUpsertAnalyticsState.mockReset()
  store.set(analyticsEnabledAtom, true)
})

describe('applyJourneyStep', () => {
  it('starts a new instance queued for upload', () => {
    const instance = openOnboarding()

    expect(instance).toMatchObject({
      kind: 'journey',
      name: 'onboarding',
      schemaVersion: 1,
      revision: 0,
      startDay: '2026-09-21',
      updatedDay: '2026-09-21',
      payload: {step: 'opened'},
      closed: false,
      pending: true,
    })
  })

  it('merges the step into the previous state and bumps the revision', () => {
    const next = Option.getOrThrow(
      applyJourneyStep({
        definition: onboardingJourney,
        current: Option.some(someInstance({pending: false})),
        partial: {step: 'phoneSubmitted', reLogin: true},
        now: wednesday,
        newId,
      })
    )

    expect(next).toMatchObject({
      id: id(99),
      revision: 4,
      updatedDay: '2026-09-23',
      payload: {step: 'phoneSubmitted', reLogin: true},
      pending: true,
    })
  })

  it('closes the instance on a terminal step', () => {
    const next = Option.getOrThrow(
      applyJourneyStep({
        definition: onboardingJourney,
        current: Option.some(someInstance()),
        partial: {step: 'onboardingFinished'},
        now: wednesday,
        newId,
      })
    )

    expect(next.closed).toBe(true)
  })

  it('ignores steps after the lifetime and closes the instance', () => {
    const current = someInstance()
    const next = Option.getOrThrow(
      applyJourneyStep({
        definition: onboardingJourney,
        current: Option.some(current),
        partial: {step: 'registered'},
        now: eightDaysLater,
        newId,
      })
    )

    expect(next).toEqual({...current, closed: true})
  })

  it('rejects a state the definition schema does not accept', () => {
    const next = applyJourneyStep({
      definition: onboardingJourney,
      current: Option.none(),
      partial: {reLogin: true},
      now: monday,
      newId,
    })

    expect(Option.isNone(next)).toBe(true)
  })

  it('rounds updatedDay to the ISO week for week precision journeys', () => {
    const next = Option.getOrThrow(
      applyJourneyStep({
        definition: registrationCohortJourney,
        current: Option.none(),
        partial: {},
        now: wednesday,
        newId,
      })
    )

    expect(next.startDay).toBe('2026-09-23')
    expect(next.updatedDay).toBe('2026-09-21')
  })
})

describe('applyAggregationUpdate', () => {
  const initialState: MarketplaceWeeklyState = {
    marketplaceOpened: 0,
    firstLoadResult: 'notLoaded',
  }

  it('creates the bucket for the ISO week of now', () => {
    const next = Option.getOrThrow(
      applyAggregationUpdate({
        definition: marketplaceWeeklyAggregation,
        current: Option.none(),
        initialState,
        update: (state) => ({...state, marketplaceOpened: 1}),
        now: wednesday,
        newId,
      })
    )

    expect(next).toMatchObject({
      kind: 'aggregation',
      name: 'marketplaceWeekly',
      revision: 0,
      startDay: '2026-09-21',
      updatedDay: '2026-09-23',
      payload: {marketplaceOpened: 1, firstLoadResult: 'notLoaded'},
      pending: true,
    })
  })

  it('does nothing when the updater returns the same state', () => {
    const current = someInstance({
      kind: 'aggregation',
      name: 'marketplaceWeekly',
      payload: {marketplaceOpened: 2, firstLoadResult: 'offers'},
    })

    const next = applyAggregationUpdate({
      definition: marketplaceWeeklyAggregation,
      current: Option.some(current),
      initialState,
      update: (state) => state,
      now: wednesday,
      newId,
    })

    expect(Option.isNone(next)).toBe(true)
  })

  it('resolves buckets by week start', () => {
    expect(bucketStartDay('week', wednesday)).toBe(isoWeekStart(wednesday))
    expect(bucketStartDay('month', wednesday)).toBe('2026-09-01')

    const bucket = someInstance({
      kind: 'aggregation',
      name: 'marketplaceWeekly',
      startDay: dayOf(monday),
    })
    const instances = {[bucket.id]: bucket}
    expect(
      Option.isSome(
        findAggregationBucket(
          instances,
          'marketplaceWeekly',
          bucketStartDay('week', wednesday)
        )
      )
    ).toBe(true)
    expect(
      Option.isNone(
        findAggregationBucket(
          instances,
          'marketplaceWeekly',
          bucketStartDay('week', nextMonday)
        )
      )
    ).toBe(true)
  })
})

describe('settleInstance and pruning', () => {
  it('marks the acknowledged revision as uploaded', () => {
    const instance = someInstance()
    const settled = settleInstance(
      {[instance.id]: instance},
      instance.id,
      instance.revision,
      wednesday
    )

    expect(settled[instance.id]?.pending).toBe(false)
  })

  it('keeps a newer local revision pending', () => {
    const instance = someInstance({revision: 5})
    const settled = settleInstance(
      {[instance.id]: instance},
      instance.id,
      4,
      wednesday
    )

    expect(settled[instance.id]?.pending).toBe(true)
  })

  it('forgets closed instances and ended buckets once acknowledged', () => {
    const closed = someInstance({id: id(1), closed: true})
    const endedBucket = someInstance({
      id: id(2),
      kind: 'aggregation',
      name: 'marketplaceWeekly',
    })
    const instances = {[closed.id]: closed, [endedBucket.id]: endedBucket}

    expect(
      settleInstance(instances, closed.id, 3, wednesday)
    ).not.toHaveProperty(closed.id)
    expect(
      settleInstance(instances, endedBucket.id, 3, nextMonday)
    ).not.toHaveProperty(endedBucket.id)
  })

  it('prunes expired entries with nothing left to upload', () => {
    const expiredJourney = someInstance({id: id(1), pending: false})
    const expiredButPending = someInstance({id: id(2), pending: true})
    const pruned = pruneSettledExpired(
      {[expiredJourney.id]: expiredJourney, [id(2)]: expiredButPending},
      eightDaysLater
    )

    expect(Object.keys(pruned)).toEqual([id(2)])
  })

  it('lists only entries with something to upload', () => {
    const ready = someInstance({id: id(1), pending: true})
    const uploaded = someInstance({id: id(2), pending: false})

    expect(pendingUploads({[id(1)]: ready, [id(2)]: uploaded})).toEqual([ready])
  })
})

describe('flushAnalyticsActionAtom', () => {
  const flushWith = async (
    instance: AnalyticsInstance,
    result: Effect.Effect<void, unknown>
  ): Promise<AnalyticsInstance | undefined> => {
    const store = getDefaultStore()
    store.set(setAnalyticsInstancesAtom, {[instance.id]: instance})
    mockUpsertAnalyticsState.mockReturnValue(result)

    await Effect.runPromise(store.set(flushAnalyticsActionAtom))

    return store.get(analyticsInstancesAtom)[instance.id]
  }

  it('uploads the state without the local bookkeeping', async () => {
    const instance = someInstance()
    await flushWith(instance, Effect.void)

    expect(mockUpsertAnalyticsState).toHaveBeenCalledWith({
      id: instance.id,
      kind: 'journey',
      name: 'onboarding',
      schemaVersion: 1,
      revision: 3,
      startDay: '2026-09-21',
      updatedDay: '2026-09-21',
      payload: {step: 'intro'},
    })
  })

  it('marks the entry uploaded on success', async () => {
    const after = await flushWith(someInstance(), Effect.void)
    expect(after?.pending).toBe(false)
  })

  it('drops the entry on a 4xx response', async () => {
    const after = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'InvalidAnalyticsStateError', status: 400})
    )
    expect(after?.pending).toBe(false)

    const afterNotFound = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'ResponseError', response: {status: 404}})
    )
    expect(afterNotFound?.pending).toBe(false)
  })

  it('keeps the entry when rate limited', async () => {
    const after = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'ResponseError', response: {status: 429}})
    )
    expect(after?.pending).toBe(true)
  })

  it('keeps the entry on 5xx and network errors', async () => {
    const after5xx = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'UnexpectedServerError', status: 500})
    )
    expect(after5xx?.pending).toBe(true)

    const afterOffline = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'RequestError', reason: 'Transport'})
    )
    expect(afterOffline?.pending).toBe(true)
  })
})

describe('journey step upload', () => {
  const reportOnboarding = journeyReportActionAtom(onboardingJourney)
  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  const onboardingInstance = (): AnalyticsInstance =>
    Option.getOrThrow(
      Option.fromNullable(
        Object.values(store.get(analyticsInstancesAtom)).find(
          (one) => one.name === 'onboarding'
        )
      )
    )

  beforeEach(() => {
    store.set(setAnalyticsInstancesAtom, {})
  })

  it('uploads the step right away', async () => {
    mockUpsertAnalyticsState.mockReturnValue(Effect.void)

    store.set(reportOnboarding, {step: 'opened'})
    await settle()

    expect(mockUpsertAnalyticsState).toHaveBeenCalledTimes(1)
    expect(mockUpsertAnalyticsState).toHaveBeenCalledWith(
      expect.objectContaining({revision: 0, payload: {step: 'opened'}})
    )
    expect(onboardingInstance().pending).toBe(false)
  })

  it('leaves aggregations pending until a lifecycle flush', async () => {
    const aggregation = someInstance({
      kind: 'aggregation',
      name: 'marketplaceWeekly',
      payload: {marketplaceOpened: 1, firstLoadResult: 'empty'},
    })
    store.set(setAnalyticsInstancesAtom, {[aggregation.id]: aggregation})
    mockUpsertAnalyticsState.mockReturnValue(Effect.void)

    store.set(reportOnboarding, {step: 'opened'})
    await settle()

    expect(mockUpsertAnalyticsState).toHaveBeenCalledTimes(1)
    expect(mockUpsertAnalyticsState).toHaveBeenCalledWith(
      expect.objectContaining({name: 'onboarding'})
    )
    expect(store.get(analyticsInstancesAtom)[aggregation.id]?.pending).toBe(
      true
    )

    await Effect.runPromise(store.set(flushAnalyticsActionAtom))

    expect(mockUpsertAnalyticsState).toHaveBeenLastCalledWith(
      expect.objectContaining({name: 'marketplaceWeekly'})
    )
    expect(store.get(analyticsInstancesAtom)[aggregation.id]?.pending).toBe(
      false
    )
  })

  it('collapses steps recorded during an upload into one request with the latest state', async () => {
    const firstUpload = Effect.runSync(Deferred.make())
    mockUpsertAnalyticsState
      .mockReturnValueOnce(Deferred.await(firstUpload))
      .mockReturnValue(Effect.void)

    store.set(reportOnboarding, {step: 'opened'})
    await settle()
    store.set(reportOnboarding, {step: 'intro'})
    store.set(reportOnboarding, {step: 'phoneSubmitted'})
    await settle()
    expect(mockUpsertAnalyticsState).toHaveBeenCalledTimes(1)

    Effect.runSync(Deferred.succeed(firstUpload, undefined))
    await settle()

    expect(mockUpsertAnalyticsState).toHaveBeenCalledTimes(2)
    expect(mockUpsertAnalyticsState).toHaveBeenLastCalledWith(
      expect.objectContaining({revision: 2, payload: {step: 'phoneSubmitted'}})
    )
    expect(onboardingInstance().pending).toBe(false)
  })

  it('keeps a failed upload pending for the next flush', async () => {
    mockUpsertAnalyticsState.mockReturnValue(
      Effect.fail({_tag: 'RequestError', reason: 'Transport'})
    )

    store.set(reportOnboarding, {step: 'opened'})
    await settle()
    expect(onboardingInstance().pending).toBe(true)

    mockUpsertAnalyticsState.mockReturnValue(Effect.void)
    await Effect.runPromise(store.set(flushAnalyticsActionAtom))

    expect(mockUpsertAnalyticsState).toHaveBeenLastCalledWith(
      expect.objectContaining({revision: 0, payload: {step: 'opened'}})
    )
    expect(onboardingInstance().pending).toBe(false)
  })
})

describe('opt-out', () => {
  it.each([false, true])(
    'does not send captured entries after opt-out (re-enabled: %s)',
    async (reEnable) => {
      const first = someInstance({id: id(1)})
      const second = someInstance({id: id(2)})
      store.set(setAnalyticsInstancesAtom, {
        [first.id]: first,
        [second.id]: second,
      })
      const started = Effect.runSync(Deferred.make())
      const finish = Effect.runSync(Deferred.make())
      mockUpsertAnalyticsState
        .mockReturnValueOnce(
          Deferred.succeed(started, undefined).pipe(
            Effect.andThen(Deferred.await(finish))
          )
        )
        .mockReturnValue(Effect.void)
      const flushing = Effect.runPromise(store.set(flushAnalyticsActionAtom))
      await Effect.runPromise(Deferred.await(started))

      store.set(analyticsEnabledAtom, false)
      if (reEnable) store.set(analyticsEnabledAtom, true)
      Effect.runSync(Deferred.succeed(finish, undefined))
      await flushing

      expect(mockUpsertAnalyticsState).toHaveBeenCalledTimes(1)
      expect(store.get(analyticsInstancesAtom)).toEqual({})
    }
  )

  it('wipes the local analytics state', () => {
    const store = getDefaultStore()
    const instance = someInstance()
    store.set(setAnalyticsInstancesAtom, {[instance.id]: instance})

    store.set(analyticsEnabledAtom, false)

    expect(store.get(analyticsEnabledAtom)).toBe(false)
    expect(store.get(analyticsInstancesAtom)).toEqual({})
  })
})

describe('storage clear', () => {
  it('leaves no analytics behind on logout', async () => {
    store.set(setAnalyticsMarkersAtom, {firstOpenAt: unixMillisecondsNow()})
    store.set(setAnalyticsInstancesAtom, {[id(1)]: someInstance()})

    await clearMmkvStorageAndEmptyAtoms()

    expect(store.get(analyticsMarkersAtom)).toEqual({})
    expect(store.get(analyticsInstancesAtom)).toEqual({})
    expect(storage._storage.getAllKeys()).toEqual([])
  })

  it('keeps the pre-login journey and markers when asked to', async () => {
    const markers = {firstOpenAt: unixMillisecondsNow()}
    const instance = someInstance()
    store.set(setAnalyticsMarkersAtom, markers)
    store.set(setAnalyticsInstancesAtom, {[instance.id]: instance})

    await clearMmkvStorageAndEmptyAtoms({keepAnalytics: true})

    expect(store.get(analyticsMarkersAtom)).toEqual(markers)
    expect(store.get(analyticsInstancesAtom)).toEqual({[instance.id]: instance})
    expect(storage._storage.getAllKeys().sort()).toEqual([
      'analyticsInstances',
      'analyticsMarkers',
    ])
  })
})
