import {
  generatePrivateKey,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  OfferId,
  OfferInfo,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import updateOffer from '@vexl-next/resources-utils/src/offers/updateOffer'
import updatePrivateParts from '@vexl-next/resources-utils/src/offers/updatePrivateParts'
import {PrivatePartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptPrivatePart'
import {Array, Deferred, Effect, Fiber, Option, Schema} from 'effect'
import {type atom, createStore} from 'jotai'
import {type focusAtom} from 'jotai-optics'
import {offersStateAtom} from '../../marketplace/atoms/offersState'
import {updateOfferActionAtom} from '../../marketplace/atoms/updateOfferActionAtom'
import {
  ConnectionsState,
  OfferToConnectionsItem,
  OfferToConnectionsItems,
} from '../domain'
import connectionStateAtom from './connectionStateAtom'
import {offersReencryptionStartedAtAtom} from './offersReencryptionStartedAtAtom'
import offerToConnectionsAtom, {
  updateAndReencryptAllOffersConnectionsActionAtom,
  updateAndReencryptSingleOfferConnectionActionAtom,
} from './offerToConnectionsAtom'

jest.mock('@vexl-next/resources-utils/src/offers/updatePrivateParts')
jest.mock('@vexl-next/resources-utils/src/offers/updateOffer')
jest.mock('../../session', () => {
  const {atom} = jest.requireActual('jotai')
  return {sessionDataOrDummyAtom: atom({privateKey: {}, keyPairV2: {}})}
})
jest.mock('../../marketplace/atoms/offersMissingOnServer', () => ({
  reencryptSingleOfferMissingOnServerWhenEditingActionAtom: null,
}))
jest.mock('../../clubs/atom/refreshClubsActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    syncAllClubsHandleStateWhenNotFoundActionAtom: atom(
      null,
      () => Effect.void
    ),
  }
})
jest.mock('../../../utils/atomUtils/atomWithParsedMmkvStorage', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    atomWithParsedMmkvStorage: (_key: string, initial: unknown) =>
      Object.assign(atom(initial), {flushNow: jest.fn()}),
  }
})
jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {apiAtom: atom({offer: {}})}
})
jest.mock('./connectionStateAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {HashMap} = jest.requireActual('effect')
  return {
    __esModule: true,
    default: Object.assign(
      atom({
        lastUpdate: 0,
        firstLevel: [],
        secondLevel: [],
        commonFriends: HashMap.empty(),
        verifiedFriends: HashMap.empty(),
      }),
      {flushNow: jest.fn()}
    ),
    fetchConnectionsActionAtom: atom(null, () => mockFetchGraph()),
  }
})
jest.mock('../../clubs/atom/clubsWithMembersAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {clubsWithMembersAtom: atom([])}
})
jest.mock('../../marketplace/atoms/offersState', () => {
  const jotai = jest.requireActual<{atom: typeof atom}>('jotai')
  const optics = jest.requireActual<{focusAtom: typeof focusAtom}>(
    'jotai-optics'
  )
  const effect = jest.requireActual<{
    Array: typeof Array
    Option: typeof Option
  }>('effect')
  const offersStateAtom = Object.assign(
    jotai.atom<{offers: OneOfferInState[]}>({offers: []}),
    {flushNow: jest.fn()}
  )
  return {
    offersStateAtom,
    offersAtom: optics.focusAtom(offersStateAtom, (optic) =>
      optic.prop('offers')
    ),
    singleOfferByAdminIdAtom: (adminId: string) =>
      jotai.atom((get) =>
        effect.Array.findFirst(
          get(offersStateAtom).offers,
          (offer) => offer.ownershipInfo?.adminId === adminId
        ).pipe(effect.Option.getOrUndefined)
      ),
  }
})
jest.mock(
  '../../../utils/notifications/showDebugNotificationIfEnabled',
  () => ({showDebugNotificationIfEnabled: jest.fn()})
)
jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../../utils/reportTime', () => ({startMeasure: () => () => 0}))
jest.mock('../../ActionBenchmarks', () => ({
  effectWithEnsuredBenchmark: () => (effect: unknown) => effect,
}))

const publicKey = Schema.decodeSync(PublicKeyV2)('V2_PUB_recipient')
const otherKey = generatePrivateKey().publicKeyPemBase64
const initial = Schema.decodeUnknownSync(OfferToConnectionsItem)({
  adminId: 'admin-id',
  symmetricKey: 'symmetric-key',
  connections: {firstLevel: [publicKey, otherKey]},
})
const second = Schema.decodeUnknownSync(OfferToConnectionsItem)({
  ...initial,
  adminId: 'second-offer',
})
const offerInfo = Schema.decodeUnknownSync(OfferInfo)({
  id: 1,
  offerId: initial.adminId,
  createdAt: '2026-09-11T00:00:00.000Z',
  modifiedAt: '2026-09-11T00:00:00.000Z',
  privatePart: {
    symmetricKey: initial.symmetricKey,
    commonFriends: [],
    friendLevel: [],
  },
  publicPart: {
    offerPublicKey: otherKey,
    location: [],
    offerDescription: 'offer',
    amountBottomLimit: 1,
    amountTopLimit: 2,
    feeState: 'WITHOUT_FEE',
    feeAmount: 0,
    locationState: [],
    paymentMethod: [],
    btcNetwork: [],
    currency: 'CZK',
    spokenLanguages: [],
    offerType: 'SELL',
    activePriceState: 'NONE',
    activePriceValue: 0,
    activePriceCurrency: 'CZK',
    active: true,
    groupUuids: [],
  },
})
const mockFetchGraph = jest.fn<Effect.Effect<ConnectionsState, unknown>, []>()
function graph(friends: string[]): ConnectionsState {
  return Schema.decodeUnknownSync(ConnectionsState)({
    lastUpdate: 1,
    firstLevel: [publicKey, otherKey],
    secondLevel: [],
    commonFriends: [
      [publicKey, friends],
      [otherKey, friends],
    ],
    verifiedFriends: [],
  })
}
function setupStore(
  records: OfferToConnectionsItem[] = [initial]
): ReturnType<typeof createStore> {
  const store = createStore()
  store.set(offerToConnectionsAtom, {offerToConnections: records})
  store.set(offersStateAtom, (state) => ({
    ...state,
    offers: Array.map(
      records,
      (record): OneOfferInState => ({
        offerInfo: {
          ...offerInfo,
          offerId: Schema.decodeSync(OfferId)(record.adminId),
        },
        ownershipInfo: {
          adminId: record.adminId,
          intendedConnectionLevel: 'ALL',
          intendedClubs: [],
        },
        flags: {reported: false},
      })
    ),
  }))
  store.set(connectionStateAtom, graph(['old-friend']))
  return store
}
function result(
  updateSuccess = true
): Effect.Effect.Success<ReturnType<typeof updatePrivateParts>> {
  return {
    updateSuccess,
    encryptionErrors: [],
    timeLimitReachedErrors: [],
    removedConnections: [],
    newConnections: {firstLevel: [], secondLevel: [], clubs: {}},
  }
}
function refreshSets(): Array<readonly string[]> {
  return Array.map(
    jest.mocked(updatePrivateParts).mock.calls,
    ([params]) => params.connectionsToRefresh ?? []
  )
}
function run(
  store: ReturnType<typeof createStore>,
  isInBackground = false
): Promise<ReadonlyArray<{adminId: string; success: boolean}>> {
  return Effect.runPromise(
    store.set(updateAndReencryptAllOffersConnectionsActionAtom, {
      isInBackground,
    })
  )
}
beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(offerToConnectionsAtom.flushNow).mockReset().mockReturnValue(true)
  jest.mocked(connectionStateAtom.flushNow).mockReset().mockReturnValue(true)
  mockFetchGraph
    .mockReset()
    .mockReturnValue(Effect.succeed(graph(['new-friend'])))
  jest
    .mocked(updatePrivateParts)
    .mockReset()
    .mockReturnValue(Effect.succeed(result()))
  jest
    .mocked(updateOffer)
    .mockReset()
    .mockReturnValue(Effect.succeed(offerInfo))
})

it.each([true, false])(
  'keeps the status active through uploads and clears it after the batch (success: %s)',
  async (success) => {
    const store = setupStore([initial, second])
    const onProgres = jest.fn()
    let startedAt: number | null = null
    jest.mocked(updatePrivateParts).mockImplementation(({onProgress}) =>
      Effect.sync(() => {
        onProgress?.({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})
        expect(store.get(offersReencryptionStartedAtAtom)).toBe(startedAt)
        onProgress?.({
          type: 'ENCRYPTING_PRIVATE_PAYLOADS',
          currentlyProcessingIndex: 0,
          totalToEncrypt: 1,
        })
        if (startedAt === null) {
          startedAt = store.get(offersReencryptionStartedAtAtom)
          expect(startedAt).not.toBeNull()
        }
        onProgress?.({type: 'SENDING_OFFER_TO_NETWORK'})
        onProgress?.({type: 'DONE'})
        expect(store.get(offersReencryptionStartedAtAtom)).toBe(startedAt)
        return result(success)
      })
    )

    await Effect.runPromise(
      store.set(updateAndReencryptAllOffersConnectionsActionAtom, {onProgres})
    )

    expect(onProgres).toHaveBeenCalledTimes(8)
    expect(store.get(offersReencryptionStartedAtAtom)).toBeNull()
  }
)

it('does not show encryption activity for a refresh without payloads to encrypt', async () => {
  const store = setupStore()
  const listener = jest.fn()
  const unsubscribe = store.sub(offersReencryptionStartedAtAtom, listener)
  jest.mocked(updatePrivateParts).mockImplementation(({onProgress}) =>
    Effect.sync(() => {
      onProgress?.({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})
      onProgress?.({type: 'SENDING_OFFER_TO_NETWORK'})
      onProgress?.({type: 'DONE'})
      return result()
    })
  )

  await run(store)

  expect(listener).not.toHaveBeenCalled()
  unsubscribe()
})

it('does not rewrite unchanged connection records before retrying pending encryption', async () => {
  const record = {...initial, pendingConnectionsToRefresh: [publicKey]}
  const store = setupStore([record])
  const unchanged = store.get(connectionStateAtom)
  mockFetchGraph.mockReturnValue(Effect.succeed(unchanged))
  const listener = jest.fn()
  const unsubscribe = store.sub(offerToConnectionsAtom, listener)
  jest.mocked(updatePrivateParts).mockImplementation(() =>
    Effect.sync(() => {
      expect(listener).not.toHaveBeenCalled()
      expect(store.get(offerToConnectionsAtom).offerToConnections[0]).toBe(
        record
      )
      return result()
    })
  )

  await run(store)

  unsubscribe()
})

it('persists already queued recipients before advancing a changed graph baseline', async () => {
  const store = setupStore([
    {...initial, pendingConnectionsToRefresh: [publicKey]},
  ])
  const listener = jest.fn()
  const unsubscribe = store.sub(offerToConnectionsAtom, listener)
  jest.mocked(offerToConnectionsAtom.flushNow).mockImplementation(() => {
    expect(listener).toHaveBeenCalled()
    return true
  })

  await run(store)

  unsubscribe()
})

it.each([false, true])(
  'keeps encryption status active across ten offers for new and existing recipients (all new: %s)',
  async (allNew) => {
    const recipients = Array.makeBy(3, (i) =>
      Schema.decodeSync(PublicKeyV2)(`V2_PUB_recipient-${i}`)
    )
    const records = Array.makeBy(10, (i) =>
      Schema.decodeUnknownSync(OfferToConnectionsItem)({
        ...initial,
        adminId: `offer-${i}`,
        connections: {
          firstLevel: allNew ? [] : recipients,
          secondLevel: [],
          clubs: {},
        },
      })
    )
    const store = setupStore(records)
    const previous = Schema.decodeUnknownSync(ConnectionsState)({
      lastUpdate: 1,
      firstLevel: recipients,
      secondLevel: [],
      commonFriends: [],
      verifiedFriends: [],
    })
    store.set(connectionStateAtom, previous)
    mockFetchGraph.mockReturnValue(
      Effect.succeed(
        Schema.decodeUnknownSync(ConnectionsState)({
          lastUpdate: 2,
          firstLevel: recipients,
          secondLevel: [],
          commonFriends: [[recipients[0], ['new-friend']]],
          verifiedFriends: [],
        })
      )
    )
    jest.mocked(updatePrivateParts).mockImplementation(({onProgress}) =>
      Effect.sync(() => {
        onProgress?.({
          type: 'ENCRYPTING_PRIVATE_PAYLOADS',
          currentlyProcessingIndex: 0,
          totalToEncrypt: allNew ? recipients.length : 1,
        })
        expect(store.get(offersReencryptionStartedAtAtom)).not.toBeNull()
        onProgress?.({type: 'SENDING_OFFER_TO_NETWORK'})
        expect(store.get(offersReencryptionStartedAtAtom)).not.toBeNull()
        return result()
      })
    )

    await run(store)

    expect(store.get(offersReencryptionStartedAtAtom)).toBeNull()
  }
)

it('retries pending queues on an unchanged graph without duplicating recipients', async () => {
  const recipients = Array.makeBy(30, (i) =>
    Schema.decodeSync(PublicKeyV2)(`V2_PUB_pending-${i}`)
  )
  const records = Array.makeBy(10, (i) =>
    Schema.decodeUnknownSync(OfferToConnectionsItem)({
      ...initial,
      adminId: `pending-offer-${i}`,
      pendingConnectionsToRefresh: [...recipients, ...recipients],
      connections: {firstLevel: recipients, secondLevel: [], clubs: {}},
    })
  )
  const store = setupStore(records)
  const unchanged = Schema.decodeUnknownSync(ConnectionsState)({
    lastUpdate: 1,
    firstLevel: recipients,
    secondLevel: [],
    commonFriends: [],
    verifiedFriends: [],
  })
  store.set(connectionStateAtom, unchanged)
  mockFetchGraph.mockReturnValue(Effect.succeed(unchanged))
  jest.mocked(updatePrivateParts).mockReturnValue(Effect.succeed(result(false)))

  await run(store)

  expect(updatePrivateParts).toHaveBeenCalledTimes(10)
  for (const keys of refreshSets()) expect(keys).toEqual(recipients)
  for (const record of store.get(offerToConnectionsAtom).offerToConnections)
    expect(record.pendingConnectionsToRefresh).toEqual(recipients)

  jest.mocked(updatePrivateParts).mockReturnValue(Effect.succeed(result()))
  await run(store)

  for (const record of store.get(offerToConnectionsAtom).offerToConnections)
    expect(record.pendingConnectionsToRefresh).toEqual([])
})

it.each([false, true])(
  'refreshes only changed v2 recipients, then skips unchanged recipients (background: %s)',
  async (isInBackground) => {
    const store = setupStore()
    jest.mocked(updatePrivateParts).mockImplementationOnce((params) =>
      Effect.sync(() => {
        expect(store.get(connectionStateAtom)).toEqual(graph(['new-friend']))
        expect(params.connectionsToRefresh).toEqual([publicKey])
        expect(params.targetConnections.firstLevel).toEqual([
          publicKey,
          otherKey,
        ])
        expect(params.commonFriends).toEqual(
          graph(['new-friend']).commonFriends
        )
        return result()
      })
    )
    await run(store, isInBackground)
    expect(store.get(connectionStateAtom)).toEqual(graph(['new-friend']))
    expect(connectionStateAtom.flushNow).toHaveBeenCalled()
    await run(store, isInBackground)
    expect(refreshSets()).toEqual([[publicKey], []])
  }
)

it('persists failed offers and retries only their refreshes after restarting', async () => {
  const store = setupStore([initial, second])
  let persistedOffers = ''
  let persistedGraph = ''
  jest.mocked(offerToConnectionsAtom.flushNow).mockImplementation(() => {
    persistedOffers = Schema.encodeSync(
      Schema.parseJson(OfferToConnectionsItems)
    )(store.get(offerToConnectionsAtom))
    return true
  })
  jest.mocked(connectionStateAtom.flushNow).mockImplementation(() => {
    // Pending work must already be durable when the global baseline advances.
    const queued = Schema.decodeSync(Schema.parseJson(OfferToConnectionsItems))(
      persistedOffers
    )
    expect(
      Array.map(
        queued.offerToConnections,
        (one) => one.pendingConnectionsToRefresh
      )
    ).toEqual([[publicKey], [publicKey]])
    persistedGraph = Schema.encodeSync(Schema.parseJson(ConnectionsState))(
      store.get(connectionStateAtom)
    )
    return true
  })
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(Effect.succeed(result()))
    .mockReturnValueOnce(Effect.succeed(result(false)))
  await run(store)
  expect(store.get(connectionStateAtom)).toEqual(graph(['new-friend']))
  const restored = Schema.decodeSync(Schema.parseJson(OfferToConnectionsItems))(
    persistedOffers
  )
  expect(
    Array.map(
      restored.offerToConnections,
      (one) => one.pendingConnectionsToRefresh
    )
  ).toEqual([[], [publicKey]])
  const restarted = setupStore(restored.offerToConnections)
  restarted.set(
    connectionStateAtom,
    Schema.decodeSync(Schema.parseJson(ConnectionsState))(persistedGraph)
  )
  jest.mocked(offerToConnectionsAtom.flushNow).mockReset().mockReturnValue(true)
  jest.mocked(connectionStateAtom.flushNow).mockReset().mockReturnValue(true)
  await run(restarted)
  expect(refreshSets()).toEqual([[publicKey], [publicKey], [], [publicKey]])
})

it('keeps pending work after interruption and releases the sync lock', async () => {
  const store = setupStore([initial, second])
  const started = await Effect.runPromise(Deferred.make<undefined>())
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(Effect.succeed(result()))
    .mockImplementationOnce(({onProgress}) =>
      Effect.sync(() => {
        onProgress?.({
          type: 'ENCRYPTING_PRIVATE_PAYLOADS',
          currentlyProcessingIndex: 0,
          totalToEncrypt: 1,
        })
      }).pipe(
        Effect.andThen(Deferred.succeed(started, undefined)),
        Effect.andThen(Effect.never)
      )
    )
  const running = Effect.runFork(
    store.set(updateAndReencryptAllOffersConnectionsActionAtom, {})
  )
  await Effect.runPromise(Deferred.await(started))
  expect(store.get(offersReencryptionStartedAtAtom)).not.toBeNull()
  await Effect.runPromise(Fiber.interrupt(running))
  expect(store.get(offersReencryptionStartedAtAtom)).toBeNull()
  expect(store.get(connectionStateAtom)).toEqual(graph(['new-friend']))
  expect(
    Array.map(
      store.get(offerToConnectionsAtom).offerToConnections,
      (one) => one.pendingConnectionsToRefresh
    )
  ).toEqual([[], [publicKey]])
  await run(store)
  expect(refreshSets()).toEqual([[publicKey], [publicKey], [], [publicKey]])
})

it('a manual edit completes its own refresh and queues the other offers', async () => {
  const store = setupStore([initial, second])
  await Effect.runPromise(
    store.set(updateOfferActionAtom, {
      adminId: initial.adminId,
      symmetricKey: initial.symmetricKey,
      payloadPublic: offerInfo.publicPart,
      intendedConnectionLevel: 'ALL',
      intendedClubs: [],
      updatePrivateParts: true,
    })
  )
  expect(refreshSets()).toEqual([[publicKey]])
  expect(
    jest.mocked(updatePrivateParts).mock.lastCall?.[0].commonFriends
  ).toEqual(graph(['new-friend']).commonFriends)
  expect(store.get(connectionStateAtom)).toEqual(graph(['new-friend']))
  expect(store.get(offerToConnectionsAtom).offerToConnections).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        adminId: initial.adminId,
        pendingConnectionsToRefresh: [],
      }),
      expect.objectContaining({
        adminId: second.adminId,
        pendingConnectionsToRefresh: [publicKey],
      }),
    ])
  )
  await run(store)
  expect(refreshSets()).toEqual([[publicKey], [publicKey], []])
})

it('falls back to the stored graph with nothing to refresh when the fetch fails', async () => {
  const store = setupStore()
  mockFetchGraph.mockReturnValue(Effect.fail(new Error('offline')))
  expect(await run(store)).toEqual([{adminId: initial.adminId, success: true}])
  expect(refreshSets()).toEqual([[]])
  expect(
    jest.mocked(updatePrivateParts).mock.lastCall?.[0].commonFriends
  ).toEqual(graph(['old-friend']).commonFriends)
  expect(store.get(connectionStateAtom)).toEqual(graph(['old-friend']))
  expect(connectionStateAtom.flushNow).not.toHaveBeenCalled()
})

it('retries pending refreshes using the stored graph when fetching fails', async () => {
  const store = setupStore([initial, second])
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(Effect.succeed(result()))
    .mockReturnValueOnce(Effect.succeed(result(false)))
  await run(store)

  mockFetchGraph.mockReturnValue(Effect.fail('offline'))
  await run(store)
  expect(refreshSets()).toEqual([[publicKey], [publicKey], [], [publicKey]])
  expect(
    jest.mocked(updatePrivateParts).mock.lastCall?.[0].commonFriends
  ).toEqual(graph(['new-friend']).commonFriends)
})

it('keeps an offer pending when its upload effect fails', async () => {
  const store = setupStore([initial, second])
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(Effect.succeed(result()))
    .mockReturnValueOnce(Effect.fail(new NotFoundError()))
  expect(await run(store)).toEqual([
    {adminId: initial.adminId, success: true},
    {adminId: second.adminId, success: false},
  ])
  await run(store)
  expect(refreshSets()).toEqual([[publicKey], [publicKey], [], [publicKey]])
})

it('keeps an offer pending when a recipient could not be encrypted for', async () => {
  const store = setupStore([initial, second])
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(Effect.succeed(result()))
    .mockReturnValueOnce(
      Effect.succeed({
        ...result(),
        encryptionErrors: [
          new PrivatePartEncryptionError({
            cause: 'encryption failed',
            message: 'encryption failed',
            toPublicKey: publicKey,
          }),
        ],
      })
    )
  expect(await run(store)).toEqual([
    {adminId: initial.adminId, success: true},
    {adminId: second.adminId, success: false},
  ])
  await run(store)
  expect(refreshSets()).toEqual([[publicKey], [publicKey], [], [publicKey]])
})

it('merges subsequent graph changes with failed work and uses the latest payload data', async () => {
  const anotherKey = Schema.decodeSync(PublicKeyV2)('V2_PUB_another-recipient')
  const records = Array.map([initial, second], (one) => ({
    ...one,
    connections: {...one.connections, firstLevel: [publicKey, anotherKey]},
  }))
  const snapshot = (
    firstFriends: string[],
    secondFriends: string[]
  ): ConnectionsState =>
    Schema.decodeUnknownSync(ConnectionsState)({
      ...graph([]),
      firstLevel: [publicKey, anotherKey],
      commonFriends: [
        [publicKey, firstFriends],
        [anotherKey, secondFriends],
      ],
      verifiedFriends: [],
    })
  const store = setupStore(records)
  store.set(connectionStateAtom, snapshot(['old'], ['old']))
  mockFetchGraph.mockReturnValue(Effect.succeed(snapshot(['changed'], ['old'])))
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(Effect.succeed(result()))
    .mockReturnValueOnce(Effect.succeed(result(false)))
  await run(store)

  mockFetchGraph.mockReturnValue(
    Effect.succeed(snapshot(['changed'], ['changed']))
  )
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(Effect.succeed(result()))
    .mockReturnValueOnce(Effect.succeed(result(false)))
  await run(store)
  expect(refreshSets()).toEqual([
    [publicKey],
    [publicKey],
    [anotherKey],
    [publicKey, anotherKey],
  ])

  const latest = snapshot(['changed-again'], ['changed'])
  mockFetchGraph.mockReturnValue(Effect.succeed(latest))
  await run(store)
  expect(refreshSets()).toEqual([
    [publicKey],
    [publicKey],
    [anotherKey],
    [publicKey, anotherKey],
    [publicKey],
    [publicKey, anotherKey],
  ])
  expect(
    jest.mocked(updatePrivateParts).mock.lastCall?.[0].commonFriends
  ).toEqual(latest.commonFriends)
})

it('queues only existing recipients and leaves new recipients to the membership diff', async () => {
  const store = setupStore([
    {
      ...initial,
      connections: {...initial.connections, firstLevel: [otherKey]},
    },
  ])
  await run(store)
  expect(refreshSets()).toEqual([[]])
  expect(
    jest.mocked(updatePrivateParts).mock.lastCall?.[0].targetConnections
      .firstLevel
  ).toEqual([publicKey, otherKey])
})

it('retains work for offers skipped by the background deadline', async () => {
  const store = setupStore([initial, second])
  const start = Date.now()
  const now = jest.spyOn(Date, 'now').mockReturnValue(start)
  try {
    jest.mocked(updatePrivateParts).mockImplementationOnce(() =>
      Effect.sync(() => {
        now.mockReturnValue(start + 30_000)
        return result()
      })
    )
    expect(await run(store, true)).toEqual([
      {adminId: initial.adminId, success: true},
      {adminId: second.adminId, success: false},
    ])
    expect(refreshSets()).toEqual([[publicKey]])
    await run(store)
    expect(refreshSets()).toEqual([[publicKey], [], [publicKey]])
  } finally {
    now.mockRestore()
  }
})

it('serializes manual refreshes with full syncs so newer queued work is not cleared', async () => {
  const store = setupStore([initial, second])
  const started = await Effect.runPromise(Deferred.make<undefined>())
  const release = await Effect.runPromise(Deferred.make<undefined>())
  jest
    .mocked(updatePrivateParts)
    .mockImplementationOnce(() =>
      Deferred.succeed(started, undefined).pipe(
        Effect.andThen(Deferred.await(release)),
        Effect.as(result())
      )
    )
  mockFetchGraph
    .mockReturnValueOnce(Effect.succeed(graph(['new-friend'])))
    .mockReturnValue(Effect.succeed(graph(['newer-friend'])))
  const batch = Effect.runFork(
    store.set(updateAndReencryptAllOffersConnectionsActionAtom, {})
  )
  await Effect.runPromise(Deferred.await(started))
  const manual = Effect.runFork(
    store.set(updateAndReencryptSingleOfferConnectionActionAtom, {
      adminId: initial.adminId,
    })
  )
  await Effect.runPromise(Effect.yieldNow())
  expect(mockFetchGraph).toHaveBeenCalledTimes(1)
  expect(Option.isNone(await Effect.runPromise(Fiber.poll(manual)))).toBe(true)

  await Effect.runPromise(Deferred.succeed(release, undefined))
  await Effect.runPromise(Fiber.join(batch))
  await Effect.runPromise(Fiber.join(manual))
  expect(refreshSets()).toEqual([[publicKey], [publicKey], [publicKey]])
  expect(store.get(connectionStateAtom)).toEqual(graph(['newer-friend']))
  expect(
    Array.map(
      store.get(offerToConnectionsAtom).offerToConnections,
      (one) => one.pendingConnectionsToRefresh
    )
  ).toEqual([[], [publicKey]])
  await run(store)
  expect(refreshSets()).toEqual([
    [publicKey],
    [publicKey],
    [publicKey],
    [],
    [publicKey],
  ])
})

it('keeps the old baseline if the pending queues could not be persisted', async () => {
  const store = setupStore()
  jest.mocked(offerToConnectionsAtom.flushNow).mockReturnValueOnce(false)
  await run(store)
  expect(store.get(connectionStateAtom)).toEqual(graph(['old-friend']))
  expect(connectionStateAtom.flushNow).not.toHaveBeenCalled()
  await run(store)
  expect(refreshSets()).toEqual([[publicKey], [publicKey]])
})

it('defaults legacy records to an empty refresh queue', () => {
  expect(initial.pendingConnectionsToRefresh).toEqual([])
})

it('stores a fetched graph even when the user has no offers', async () => {
  const store = setupStore([])
  await run(store)
  expect(store.get(connectionStateAtom)).toEqual(graph(['new-friend']))
  expect(updatePrivateParts).not.toHaveBeenCalled()
})

describe('graph fetched by the caller', () => {
  const newer = {
    ...graph(['new-friend']),
    lastUpdate: Schema.decodeSync(UnixMilliseconds)(2),
  }

  it('is used without fetching again when newer than the baseline', async () => {
    const store = setupStore()
    await Effect.runPromise(
      store.set(updateAndReencryptAllOffersConnectionsActionAtom, {
        fetchedConnections: Option.some(newer),
      })
    )
    expect(mockFetchGraph).not.toHaveBeenCalled()
    expect(refreshSets()).toEqual([[publicKey]])
    expect(store.get(connectionStateAtom)).toEqual(newer)
  })

  it('is fetched again under the lock when not newer than the baseline', async () => {
    const store = setupStore()
    store.set(connectionStateAtom, newer)
    await Effect.runPromise(
      store.set(updateAndReencryptAllOffersConnectionsActionAtom, {
        fetchedConnections: Option.some(newer),
      })
    )
    expect(mockFetchGraph).toHaveBeenCalledTimes(1)
  })

  it('keeps the stored graph without fetching when the caller fetch failed', async () => {
    const store = setupStore()
    await Effect.runPromise(
      store.set(updateAndReencryptAllOffersConnectionsActionAtom, {
        fetchedConnections: Option.none(),
      })
    )
    expect(mockFetchGraph).not.toHaveBeenCalled()
    expect(refreshSets()).toEqual([[]])
    expect(store.get(connectionStateAtom)).toEqual(graph(['old-friend']))
  })
})
