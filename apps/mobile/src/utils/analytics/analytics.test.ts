import {
  bucketStartDay,
  dayOf,
  isoWeekStart,
} from '@vexl-next/analytics-definitions/src/buckets'
import {AnalyticsStateId} from '@vexl-next/analytics-definitions/src/core'
import {offerJourney} from '@vexl-next/analytics-definitions/src/definitions/offer'
import {onboardingJourney} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {
  testAggregation,
  testJourney,
  testWeekJourney,
  type TestAggregationState,
} from '@vexl-next/analytics-definitions/src/testDefinitions'
import {newOfferId} from '@vexl-next/domain/src/general/offers'
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
  findAggregationBucket,
  pendingUploads,
  pruneExpired,
  settleInstance,
} from './instances'
import {reportOfferRequestsReceivedActionAtom} from './offer'
import {reportFirstOpenActionAtom} from './onboarding'
import {analyticsOptInAtom} from './optIn'
import {AnalyticsUploadError} from './relay'
import {journeyReportActionAtom, openJourneyStates} from './report'

jest.mock('@vexl-next/analytics-definitions/src/definitions', () =>
  jest.requireActual('@vexl-next/analytics-definitions/src/testDefinitions')
)

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
  preferencesAtom: jest
    .requireActual('../atomUtils/atomWithParsedMmkvStorage')
    .atomWithParsedMmkvStorage(
      'preferences',
      {analyticsEnabled: false},
      jest.requireActual('effect').Schema.Struct({
        analyticsEnabled: jest.requireActual('effect').Schema.Boolean,
      })
    ),
}))

jest.mock('../../api', () => ({
  apiEnv: {},
  platform: 'IOS',
  sessionCountryPrefixAtom: jest
    .requireActual('jotai')
    .atom(jest.requireActual('effect').Option.none()),
}))

jest.mock('../../state/chat/atoms/messagingStateAtom', () => ({
  __esModule: true,
  default: jest.requireActual('jotai').atom([]),
}))

const mockUploadAnalyticsState = jest.fn()
jest.mock('./relay', () => ({
  ...jest.requireActual('./relay'),
  uploadAnalyticsStateAtom: jest
    .requireActual('jotai')
    .atom(
      jest
        .requireActual('effect')
        .Option.some((state: unknown) => mockUploadAnalyticsState(state))
    ),
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
  name: 'testJourney',
  schemaVersion: 1,
  revision: 3,
  startDay: dayOf(monday),
  updatedDay: dayOf(monday),
  payload: {step: 'intro'},
  closed: false,
  pending: true,
  ...overrides,
})

const startedToday = (
  overrides: Partial<AnalyticsInstance> = {}
): AnalyticsInstance =>
  someInstance({
    startDay: dayOf(new Date()),
    updatedDay: dayOf(new Date()),
    ...overrides,
  })

const openOnboarding = (): AnalyticsInstance =>
  Option.getOrThrow(
    applyJourneyStep({
      definition: testJourney,
      current: Option.none(),
      partial: {step: 'opened'},
      now: monday,
      newId,
    })
  )

const store = getDefaultStore()

beforeEach(() => {
  nextId = 1
  mockUploadAnalyticsState.mockReset()
  store.set(analyticsOptInAtom, true)
})

describe('applyJourneyStep', () => {
  it('starts a new instance queued for upload', () => {
    const instance = openOnboarding()

    expect(instance).toMatchObject({
      kind: 'journey',
      name: 'testJourney',
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
        definition: testJourney,
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
        definition: testJourney,
        current: Option.some(someInstance()),
        partial: {step: 'finished'},
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
        definition: testJourney,
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
      definition: testJourney,
      current: Option.none(),
      partial: {reLogin: true},
      now: monday,
      newId,
    })

    expect(Option.isNone(next)).toBe(true)
  })

  describe('week precision journeys', () => {
    const startedOnWednesday = (): AnalyticsInstance =>
      Option.getOrThrow(
        applyJourneyStep({
          definition: testWeekJourney,
          current: Option.none(),
          partial: {},
          now: wednesday,
          newId,
        })
      )
    const activatedAt = (now: Date): AnalyticsInstance =>
      Option.getOrThrow(
        applyJourneyStep({
          definition: testWeekJourney,
          current: Option.some(startedOnWednesday()),
          partial: {activatedBy: 'offer'},
          now,
          newId,
        })
      )

    it('start with updatedDay equal to startDay when started mid-week', () => {
      expect(startedOnWednesday()).toMatchObject({
        startDay: '2026-09-23',
        updatedDay: '2026-09-23',
      })
    })

    it('keep updatedDay at startDay for an update in the first week', () => {
      expect(activatedAt(new Date('2026-09-27T10:00:00Z'))).toMatchObject({
        startDay: '2026-09-23',
        updatedDay: '2026-09-23',
        revision: 1,
      })
    })

    it('round updatedDay to the ISO week start from the next week on', () => {
      expect(activatedAt(eightDaysLater)).toMatchObject({
        startDay: '2026-09-23',
        updatedDay: '2026-09-28',
        revision: 1,
      })
    })
  })
})

describe('applyAggregationUpdate', () => {
  const initialState: TestAggregationState = {
    marketplaceOpened: 0,
    firstLoadResult: 'notLoaded',
  }

  it('creates the bucket for the ISO week of now', () => {
    const next = Option.getOrThrow(
      applyAggregationUpdate({
        definition: testAggregation,
        current: Option.none(),
        initialState,
        update: (state) => ({...state, marketplaceOpened: 1}),
        now: wednesday,
        newId,
      })
    )

    expect(next).toMatchObject({
      kind: 'aggregation',
      name: 'testAggregation',
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
      name: 'testAggregation',
      payload: {marketplaceOpened: 2, firstLoadResult: 'offers'},
    })

    const next = applyAggregationUpdate({
      definition: testAggregation,
      current: Option.some(current),
      initialState,
      update: (state) => state,
      now: wednesday,
      newId,
    })

    expect(Option.isNone(next)).toBe(true)
  })

  it('does nothing when the state is unchanged by value', () => {
    const atCap = someInstance({
      kind: 'aggregation',
      name: 'testAggregation',
      payload: {
        marketplaceOpened: 50,
        firstLoadResult: 'offers',
        offersVisibleBucket: '6to20',
      },
      pending: false,
    })

    const next = applyAggregationUpdate({
      definition: testAggregation,
      current: Option.some(atCap),
      initialState,
      update: (state) => ({
        ...state,
        marketplaceOpened: Math.min(state.marketplaceOpened + 1, 50),
      }),
      now: wednesday,
      newId,
    })

    expect(Option.isNone(next)).toBe(true)
  })

  it('keeps a counter at its cap', () => {
    const atCap = someInstance({
      kind: 'aggregation',
      name: 'testAggregation',
      payload: {marketplaceOpened: 50, firstLoadResult: 'offers'},
      pending: false,
    })

    const next = applyAggregationUpdate({
      definition: testAggregation,
      current: Option.some(atCap),
      initialState,
      update: (state) => ({
        ...state,
        marketplaceOpened: state.marketplaceOpened + 1,
      }),
      now: wednesday,
      newId,
    })

    expect(Option.isNone(next)).toBe(true)
  })

  it('queues the bucket when a value changed', () => {
    const belowCap = someInstance({
      kind: 'aggregation',
      name: 'testAggregation',
      payload: {marketplaceOpened: 49, firstLoadResult: 'offers'},
      pending: false,
    })

    const next = Option.getOrThrow(
      applyAggregationUpdate({
        definition: testAggregation,
        current: Option.some(belowCap),
        initialState,
        update: (state) => ({
          ...state,
          marketplaceOpened: Math.min(state.marketplaceOpened + 1, 50),
        }),
        now: wednesday,
        newId,
      })
    )

    expect(next).toMatchObject({
      revision: 4,
      payload: {marketplaceOpened: 50, firstLoadResult: 'offers'},
      pending: true,
    })
  })

  it('resolves buckets by week start', () => {
    expect(bucketStartDay('week', wednesday)).toBe(isoWeekStart(wednesday))
    expect(bucketStartDay('month', wednesday)).toBe('2026-09-01')

    const bucket = someInstance({
      kind: 'aggregation',
      name: 'testAggregation',
      startDay: dayOf(monday),
    })
    const instances = {[bucket.id]: bucket}
    expect(
      Option.isSome(
        findAggregationBucket(
          instances,
          'testAggregation',
          bucketStartDay('week', wednesday)
        )
      )
    ).toBe(true)
    expect(
      Option.isNone(
        findAggregationBucket(
          instances,
          'testAggregation',
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
      name: 'testAggregation',
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
    const pruned = pruneExpired(
      {[expiredJourney.id]: expiredJourney, [id(2)]: expiredButPending},
      eightDaysLater
    )

    expect(Object.keys(pruned)).toEqual([id(2)])
  })

  it('prunes pending entries once the server would refuse them', () => {
    const pending = someInstance({id: id(1), pending: true})
    const lastAcceptedDay = new Date('2026-10-05T23:00:00Z')
    const firstRefusedDay = new Date('2026-10-06T00:00:00Z')

    expect(pruneExpired({[id(1)]: pending}, lastAcceptedDay)).toHaveProperty(
      id(1)
    )
    expect(pruneExpired({[id(1)]: pending}, firstRefusedDay)).toEqual({})
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
    mockUploadAnalyticsState.mockReturnValue(result)

    await Effect.runPromise(store.set(flushAnalyticsActionAtom))

    return store.get(analyticsInstancesAtom)[instance.id]
  }

  it('uploads the state without the local bookkeeping', async () => {
    const instance = startedToday({
      key: 'local-offer-id',
      startedAt: unixMillisecondsNow(),
    })
    await flushWith(instance, Effect.void)

    expect(mockUploadAnalyticsState).toHaveBeenCalledWith({
      id: instance.id,
      kind: 'journey',
      name: 'testJourney',
      schemaVersion: 1,
      revision: 3,
      startDay: instance.startDay,
      updatedDay: instance.updatedDay,
      payload: {step: 'intro'},
    })
  })

  it('marks the entry uploaded on success', async () => {
    const after = await flushWith(startedToday(), Effect.void)
    expect(after?.pending).toBe(false)
  })

  it.each([400, 413])(
    'drops the entry when the gateway rejects it with %i',
    async (status) => {
      const after = await flushWith(
        startedToday(),
        Effect.fail(new AnalyticsUploadError({status}))
      )
      expect(after?.pending).toBe(false)
    }
  )

  it.each([403, 404, 429, 500, 503])(
    'keeps the entry on %i, a relay or gateway problem',
    async (status) => {
      const after = await flushWith(
        startedToday(),
        Effect.fail(new AnalyticsUploadError({status}))
      )
      expect(after?.pending).toBe(true)
    }
  )

  it('keeps the entry on network errors', async () => {
    const after = await flushWith(
      startedToday(),
      Effect.fail(new AnalyticsUploadError({cause: new Error('offline')}))
    )
    expect(after?.pending).toBe(true)
  })
})

describe('journey step upload', () => {
  const reportTestJourney = journeyReportActionAtom(testJourney)
  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  const testJourneyInstance = (): AnalyticsInstance =>
    Option.getOrThrow(
      Option.fromNullable(
        Object.values(store.get(analyticsInstancesAtom)).find(
          (one) => one.name === 'testJourney'
        )
      )
    )

  beforeEach(() => {
    store.set(setAnalyticsInstancesAtom, {})
  })

  it('uploads the step right away', async () => {
    mockUploadAnalyticsState.mockReturnValue(Effect.void)

    store.set(reportTestJourney, {step: 'opened'})
    await settle()

    expect(mockUploadAnalyticsState).toHaveBeenCalledTimes(1)
    expect(mockUploadAnalyticsState).toHaveBeenCalledWith(
      expect.objectContaining({revision: 0, payload: {step: 'opened'}})
    )
    expect(testJourneyInstance().pending).toBe(false)
  })

  it('leaves aggregations pending until a lifecycle flush', async () => {
    const aggregation = someInstance({
      kind: 'aggregation',
      name: 'testAggregation',
      startDay: isoWeekStart(new Date()),
      updatedDay: dayOf(new Date()),
      payload: {marketplaceOpened: 1, firstLoadResult: 'empty'},
    })
    store.set(setAnalyticsInstancesAtom, {[aggregation.id]: aggregation})
    mockUploadAnalyticsState.mockReturnValue(Effect.void)

    store.set(reportTestJourney, {step: 'opened'})
    await settle()

    expect(mockUploadAnalyticsState).toHaveBeenCalledTimes(1)
    expect(mockUploadAnalyticsState).toHaveBeenCalledWith(
      expect.objectContaining({name: 'testJourney'})
    )
    expect(store.get(analyticsInstancesAtom)[aggregation.id]?.pending).toBe(
      true
    )

    await Effect.runPromise(store.set(flushAnalyticsActionAtom))

    expect(mockUploadAnalyticsState).toHaveBeenLastCalledWith(
      expect.objectContaining({name: 'testAggregation'})
    )
    expect(store.get(analyticsInstancesAtom)[aggregation.id]?.pending).toBe(
      false
    )
  })

  it('collapses steps recorded during an upload into one request with the latest state', async () => {
    const firstUpload = Effect.runSync(Deferred.make())
    mockUploadAnalyticsState
      .mockReturnValueOnce(Deferred.await(firstUpload))
      .mockReturnValue(Effect.void)

    store.set(reportTestJourney, {step: 'opened'})
    await settle()
    store.set(reportTestJourney, {step: 'intro'})
    store.set(reportTestJourney, {step: 'phoneSubmitted'})
    await settle()
    expect(mockUploadAnalyticsState).toHaveBeenCalledTimes(1)

    Effect.runSync(Deferred.succeed(firstUpload, undefined))
    await settle()

    expect(mockUploadAnalyticsState).toHaveBeenCalledTimes(2)
    expect(mockUploadAnalyticsState).toHaveBeenLastCalledWith(
      expect.objectContaining({revision: 2, payload: {step: 'phoneSubmitted'}})
    )
    expect(testJourneyInstance().pending).toBe(false)
  })

  it('updates only the instance with the given key', async () => {
    mockUploadAnalyticsState.mockReturnValue(Effect.void)

    store.set(reportTestJourney, {step: 'opened'}, {key: 'a'})
    store.set(reportTestJourney, {step: 'opened'}, {key: 'b'})
    store.set(reportTestJourney, {step: 'intro'}, {key: 'b', onlyIfOpen: true})
    store.set(reportTestJourney, {step: 'intro'}, {key: 'c', onlyIfOpen: true})
    await settle()

    const steps = Object.values(store.get(analyticsInstancesAtom)).map(
      (one) => [one.key, one.payload]
    )
    expect(steps).toEqual(
      expect.arrayContaining([
        ['a', {step: 'opened'}],
        ['b', {step: 'intro'}],
      ])
    )
    expect(steps).toHaveLength(2)
  })

  it('starts a new instance on alwaysStart and updates every open one without a key', async () => {
    mockUploadAnalyticsState.mockReturnValue(Effect.void)

    store.set(reportTestJourney, {step: 'opened'})
    store.set(reportTestJourney, {step: 'opened'}, {alwaysStart: true})
    store.set(reportTestJourney, {reLogin: true}, {onlyIfOpen: true})
    await settle()

    expect(
      Object.values(store.get(analyticsInstancesAtom)).map((one) => one.payload)
    ).toEqual([
      {step: 'opened', reLogin: true},
      {step: 'opened', reLogin: true},
    ])
  })

  it('does not upload an update that changes nothing', async () => {
    mockUploadAnalyticsState.mockReturnValue(Effect.void)

    store.set(reportTestJourney, {step: 'opened'})
    await settle()
    store.set(reportTestJourney, {step: 'opened'})
    await settle()

    expect(mockUploadAnalyticsState).toHaveBeenCalledTimes(1)
  })

  it('keeps a failed upload pending for the next flush', async () => {
    mockUploadAnalyticsState.mockReturnValue(
      Effect.fail(new AnalyticsUploadError({cause: new Error('offline')}))
    )

    store.set(reportTestJourney, {step: 'opened'})
    await settle()
    expect(testJourneyInstance().pending).toBe(true)

    mockUploadAnalyticsState.mockReturnValue(Effect.void)
    await Effect.runPromise(store.set(flushAnalyticsActionAtom))

    expect(mockUploadAnalyticsState).toHaveBeenLastCalledWith(
      expect.objectContaining({revision: 0, payload: {step: 'opened'}})
    )
    expect(testJourneyInstance().pending).toBe(false)
  })

  it('lists open states without the expired ones', () => {
    const expired = someInstance({
      id: id(1),
      key: 'a',
      payload: {step: 'opened'},
    })
    const current = startedToday({id: id(2), key: 'a'})
    store.set(setAnalyticsInstancesAtom, {
      [expired.id]: expired,
      [current.id]: current,
    })

    expect(openJourneyStates(store.get, testJourney, 'a')).toEqual([
      {step: 'intro'},
    ])
  })
})

describe('offer journey', () => {
  const offerId = newOfferId()
  const startOfferJourney = journeyReportActionAtom(offerJourney)
  const offerState = (): unknown =>
    Object.values(store.get(analyticsInstancesAtom)).find(
      (one) => one.key === offerId
    )?.payload

  beforeEach(() => {
    store.set(setAnalyticsInstancesAtom, {})
    mockUploadAnalyticsState.mockReturnValue(Effect.void)
  })

  it('measures the first request from the exact local offer creation', () => {
    store.set(
      startOfferJourney,
      {offerType: 'sell', class: 'main'},
      {key: offerId, alwaysStart: true}
    )

    store.set(reportOfferRequestsReceivedActionAtom, {
      offerId,
      chats: [],
      newRequestTimes: [Date.now() + 125_000],
    })

    expect(offerState()).toMatchObject({firstRequestAfter: 'under1h'})
  })
})

describe('opt-out', () => {
  it.each([false, true])(
    'does not send captured entries after opt-out (re-enabled: %s)',
    async (reEnable) => {
      const first = startedToday({id: id(1)})
      const second = startedToday({id: id(2)})
      store.set(setAnalyticsInstancesAtom, {
        [first.id]: first,
        [second.id]: second,
      })
      const started = Effect.runSync(Deferred.make())
      const finish = Effect.runSync(Deferred.make())
      mockUploadAnalyticsState
        .mockReturnValueOnce(
          Deferred.succeed(started, undefined).pipe(
            Effect.andThen(Deferred.await(finish))
          )
        )
        .mockReturnValue(Effect.void)
      const flushing = Effect.runPromise(store.set(flushAnalyticsActionAtom))
      await Effect.runPromise(Deferred.await(started))

      store.set(analyticsOptInAtom, false)
      if (reEnable) store.set(analyticsOptInAtom, true)
      Effect.runSync(Deferred.succeed(finish, undefined))
      await flushing

      expect(mockUploadAnalyticsState).toHaveBeenCalledTimes(1)
      expect(store.get(analyticsInstancesAtom)).toEqual({})
    }
  )

  it('wipes the local analytics state', () => {
    const store = getDefaultStore()
    const instance = someInstance()
    store.set(setAnalyticsInstancesAtom, {[instance.id]: instance})

    store.set(analyticsOptInAtom, false)

    expect(store.get(analyticsEnabledAtom)).toBe(false)
    expect(store.get(analyticsInstancesAtom)).toEqual({})
  })
})

describe('opt-in', () => {
  const optInAgain = (): void => {
    store.set(analyticsOptInAtom, false)
    mockUploadAnalyticsState.mockReturnValue(Effect.void)
    store.set(analyticsOptInAtom, true)
  }

  it('records nothing until the first open is reported', () => {
    optInAgain()

    expect(store.get(analyticsMarkersAtom)).toEqual({})
    expect(store.get(analyticsInstancesAtom)).toEqual({})
  })

  it('starts the onboarding journey on the first open once', () => {
    optInAgain()

    store.set(reportFirstOpenActionAtom)
    store.set(reportFirstOpenActionAtom)

    expect(store.get(analyticsMarkersAtom).firstOpenAt).toBeDefined()
    expect(Object.values(store.get(analyticsInstancesAtom))).toEqual([
      expect.objectContaining({
        name: onboardingJourney.name,
        payload: {step: 'opened'},
      }),
    ])
  })
})

describe('storage clear', () => {
  // Mounted like in the app, so the clear resets the preferences.
  let unmountPreferences: () => void
  beforeAll(() => {
    unmountPreferences = store.sub(analyticsEnabledAtom, () => {})
  })
  afterAll(() => {
    unmountPreferences()
  })

  it('leaves no analytics behind on logout', async () => {
    store.set(setAnalyticsMarkersAtom, {firstOpenAt: unixMillisecondsNow()})
    store.set(setAnalyticsInstancesAtom, {[id(1)]: someInstance()})

    await clearMmkvStorageAndEmptyAtoms()

    expect(store.get(analyticsEnabledAtom)).toBe(false)
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

    expect(store.get(analyticsEnabledAtom)).toBe(true)
    expect(store.get(analyticsMarkersAtom)).toEqual(markers)
    expect(store.get(analyticsInstancesAtom)).toEqual({[instance.id]: instance})
    expect(storage._storage.getAllKeys().sort()).toEqual([
      'analyticsInstances',
      'analyticsMarkers',
      'preferences',
    ])
  })
})
