import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  OfferId,
  OfferInfo,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import updateOffer from '@vexl-next/resources-utils/src/offers/updateOffer'
import updatePrivateParts from '@vexl-next/resources-utils/src/offers/updatePrivateParts'
import {Array, Deferred, Effect, Fiber, type Option, Schema} from 'effect'
import {type atom, createStore} from 'jotai'
import {type focusAtom} from 'jotai-optics'
import {offersStateAtom} from '../../marketplace/atoms/offersState'
import {updateOfferActionAtom} from '../../marketplace/atoms/updateOfferActionAtom'
import {ConnectionsState, OfferToConnectionsItem} from '../domain'
import connectionStateAtom from './connectionStateAtom'
import offerToConnectionsAtom, {
  updateAndReencryptAllOffersConnectionsActionAtom,
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

const publicKey = generatePrivateKey().publicKeyPemBase64
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
    offerPublicKey: publicKey,
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
    commonFriends: [[publicKey, friends]],
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

it.each([false, true])(
  'stores the graph after all uploads, then skips unchanged recipients (background: %s)',
  async (isInBackground) => {
    const store = setupStore()
    jest.mocked(updatePrivateParts).mockImplementationOnce((params) =>
      Effect.sync(() => {
        expect(store.get(connectionStateAtom)).toEqual(graph(['old-friend']))
        expect(params.connectionsToRefresh).toEqual([publicKey])
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

it('keeps the old graph when any offer fails so the next round re-uploads the same diff', async () => {
  const store = setupStore([initial, second])
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(Effect.succeed(result()))
    .mockReturnValueOnce(Effect.succeed(result(false)))
  await run(store)
  expect(store.get(connectionStateAtom)).toEqual(graph(['old-friend']))
  expect(connectionStateAtom.flushNow).not.toHaveBeenCalled()
  await run(store)
  expect(refreshSets()).toEqual([
    [publicKey],
    [publicKey],
    [publicKey],
    [publicKey],
  ])
  expect(store.get(connectionStateAtom)).toEqual(graph(['new-friend']))
})

it('keeps the old graph after interruption', async () => {
  const store = setupStore()
  const started = await Effect.runPromise(Deferred.make<undefined>())
  jest
    .mocked(updatePrivateParts)
    .mockReturnValueOnce(
      Deferred.succeed(started, undefined).pipe(Effect.andThen(Effect.never))
    )
  const running = Effect.runFork(
    store.set(updateAndReencryptAllOffersConnectionsActionAtom, {})
  )
  await Effect.runPromise(Deferred.await(started))
  await Effect.runPromise(Fiber.interrupt(running))
  expect(store.get(connectionStateAtom)).toEqual(graph(['old-friend']))
})

it('a manual edit uploads the fresh diff for its own offer without storing the graph', async () => {
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
  expect(store.get(connectionStateAtom)).toEqual(graph(['old-friend']))
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
