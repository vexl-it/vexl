import {dayOf, isoWeekStart} from '@vexl-next/analytics-definitions/src/buckets'
import {AnalyticsStateId} from '@vexl-next/analytics-definitions/src/core'
import {
  marketplaceWeeklyAggregation,
  type MarketplaceWeeklyState,
} from '@vexl-next/analytics-definitions/src/definitions/marketplaceWeekly'
import {onboardingJourney} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {registrationCohortJourney} from '@vexl-next/analytics-definitions/src/definitions/registrationCohort'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Option, Schema} from 'effect'
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
  releaseDelayedUploads,
  settleInstance,
} from './instances'

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
  pending: 'now',
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
  it('starts a new instance queued for the next app start', () => {
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
      pending: 'nextStart',
    })
  })

  it('merges the step into the previous state and bumps the revision', () => {
    const next = Option.getOrThrow(
      applyJourneyStep({
        definition: onboardingJourney,
        current: Option.some(someInstance({pending: 'none'})),
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
      pending: 'now',
    })
  })

  it('keeps the delayed flag until the initial upload went out', () => {
    const next = Option.getOrThrow(
      applyJourneyStep({
        definition: onboardingJourney,
        current: Option.some(openOnboarding()),
        partial: {step: 'intro'},
        now: monday,
        newId,
      })
    )

    expect(next.pending).toBe('nextStart')
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
      pending: 'now',
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

    expect(settled[instance.id]?.pending).toBe('none')
  })

  it('keeps a newer local revision pending', () => {
    const instance = someInstance({revision: 5})
    const settled = settleInstance(
      {[instance.id]: instance},
      instance.id,
      4,
      wednesday
    )

    expect(settled[instance.id]?.pending).toBe('now')
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
    const expiredJourney = someInstance({id: id(1), pending: 'none'})
    const expiredButPending = someInstance({id: id(2), pending: 'now'})
    const pruned = pruneSettledExpired(
      {[expiredJourney.id]: expiredJourney, [id(2)]: expiredButPending},
      eightDaysLater
    )

    expect(Object.keys(pruned)).toEqual([id(2)])
  })

  it('uploads delayed entries only once the next start released them', () => {
    const delayed = someInstance({id: id(1), pending: 'nextStart'})
    const ready = someInstance({id: id(2), pending: 'now'})
    const uploaded = someInstance({id: id(3), pending: 'none'})
    const instances = {[id(1)]: delayed, [id(2)]: ready, [id(3)]: uploaded}

    expect(pendingUploads(instances)).toEqual([ready])
    expect(pendingUploads(releaseDelayedUploads(instances))).toEqual([
      {...delayed, pending: 'now'},
      ready,
    ])
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
    expect(after?.pending).toBe('none')
  })

  it('drops the entry on a 4xx response', async () => {
    const after = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'InvalidAnalyticsStateError', status: 400})
    )
    expect(after?.pending).toBe('none')

    const afterNotFound = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'ResponseError', response: {status: 404}})
    )
    expect(afterNotFound?.pending).toBe('none')
  })

  it('keeps the entry when rate limited', async () => {
    const after = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'ResponseError', response: {status: 429}})
    )
    expect(after?.pending).toBe('now')
  })

  it('keeps the entry on 5xx and network errors', async () => {
    const after5xx = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'UnexpectedServerError', status: 500})
    )
    expect(after5xx?.pending).toBe('now')

    const afterOffline = await flushWith(
      someInstance(),
      Effect.fail({_tag: 'RequestError', reason: 'Transport'})
    )
    expect(afterOffline?.pending).toBe('now')
  })

  it('never sends an upload still queued for the next start', async () => {
    await flushWith(someInstance({pending: 'nextStart'}), Effect.void)
    expect(mockUpsertAnalyticsState).not.toHaveBeenCalled()
  })
})

describe('opt-out', () => {
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
