import {
  OneOfferInState,
  type MyOfferInState,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, pipe, Schema} from 'effect'
import {createStore, type Setter} from 'jotai'
import {
  areThereAnyMyOffersAtom,
  myOffersCountAtom,
  myOffersSortedAtom,
  myQuickOffersAtom,
} from '../marketplace/atoms/myOffers'
import {
  areThereAnyStoredOffersAtom,
  offersAtom,
} from '../marketplace/atoms/offersState'
import {offersToSeeInMarketplaceAtom} from '../marketplace/atoms/offersToSeeInMarketplace'
import {sessionHolderAtom} from '../session'
import {dummySession} from '../session/dummySesssion'
import {othersQuickOffersByTypeAtom} from './atoms'
import {planQuickOffersReconciliation} from './planQuickOffersReconciliation'
import {reconcileQuickOffersActionAtom} from './reconcileQuickOffersActionAtom'

jest.mock('react-native-mmkv')

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {},
}))

jest.mock('../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockCreateOffer = jest.fn()
const mockDeleteOffers = jest.fn()

jest.mock('../marketplace/atoms/createOfferActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    createOfferActionAtom: atom(
      null,
      (_get: unknown, set: unknown, params: unknown) =>
        Effect.tryPromise({
          try: async () => mockCreateOffer(set, params),
          catch: () => ({_tag: 'NetworkError'}),
        })
    ),
  }
})

jest.mock('../marketplace/atoms/deleteOffersActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    deleteOffersActionAtom: atom(
      null,
      (_get: unknown, set: unknown, params: unknown) =>
        Effect.promise(async () => mockDeleteOffers(set, params))
    ),
  }
})

jest.mock('../chat/hooks/useCreateInbox', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    upsertInboxOnBeAndLocallyActionAtom: atom(null, () =>
      Effect.succeed({
        inbox: {privateKey: {publicKeyPemBase64: 'offer-public-key'}},
      })
    ),
  }
})

const offerPublicKey =
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K'

const encodedOffer = ({
  id,
  offerType,
  isQuickOffer,
  mine,
}: {
  readonly id: string
  readonly offerType: OfferType
  readonly isQuickOffer: boolean
  readonly mine: boolean
}): typeof OneOfferInState.Encoded => ({
  offerInfo: {
    id: 1,
    offerId: id,
    privatePart: {
      commonFriends: [],
      friendLevel: ['FIRST_DEGREE'],
      symmetricKey: 'symmetric-key',
    },
    publicPart: {
      offerPublicKey,
      location: [],
      offerDescription: '',
      amountBottomLimit: 0,
      amountTopLimit: 0,
      feeState: 'WITHOUT_FEE',
      feeAmount: 0,
      locationState: [],
      paymentMethod: [],
      btcNetwork: [],
      currency: 'EUR',
      spokenLanguages: [],
      offerType,
      activePriceState: 'NONE',
      activePriceValue: 0,
      activePriceCurrency: 'EUR',
      active: true,
      groupUuids: [],
      listingType: 'BITCOIN',
      isQuickOffer,
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
  },
  flags: {},
  ownershipInfo: mine
    ? {adminId: `admin-${id}`, intendedConnectionLevel: 'ALL'}
    : undefined,
})

const offer = (params: Parameters<typeof encodedOffer>[0]): OneOfferInState =>
  Schema.decodeSync(OneOfferInState)(encodedOffer(params))

const myQuickOffer = (id: string, offerType: OfferType): MyOfferInState => {
  const {ownershipInfo, ...rest} = offer({
    id,
    offerType,
    isQuickOffer: true,
    mine: true,
  })
  if (!ownershipInfo) throw new Error('Expected my offer')
  return {...rest, ownershipInfo}
}

const offerIds = (offers: readonly OneOfferInState[]): readonly string[] =>
  Array.map(offers, (one) => one.offerInfo.offerId)

describe('planQuickOffersReconciliation', () => {
  it('creates the quick offers the answer asks for', () => {
    expect(
      planQuickOffersReconciliation({
        tradingIntent: 'BOTH',
        quickOffersEnabled: true,
        myQuickOffers: [],
      })
    ).toEqual({toCreate: ['BUY', 'SELL'], toDelete: []})
  })

  it('does nothing once my quick offers match the answer', () => {
    expect(
      planQuickOffersReconciliation({
        tradingIntent: 'SELL',
        quickOffersEnabled: true,
        myQuickOffers: [myQuickOffer('sell', 'SELL')],
      })
    ).toEqual({toCreate: [], toDelete: []})
  })

  it('replaces a quick offer of the wrong type', () => {
    expect(
      planQuickOffersReconciliation({
        tradingIntent: 'BUY',
        quickOffersEnabled: true,
        myQuickOffers: [myQuickOffer('sell', 'SELL')],
      })
    ).toEqual({toCreate: ['BUY'], toDelete: ['admin-sell']})
  })

  it('keeps the first of duplicated quick offers and deletes the rest', () => {
    expect(
      planQuickOffersReconciliation({
        tradingIntent: 'BOTH',
        quickOffersEnabled: true,
        myQuickOffers: [
          myQuickOffer('buy1', 'BUY'),
          myQuickOffer('buy2', 'BUY'),
          myQuickOffer('sell', 'SELL'),
        ],
      })
    ).toEqual({toCreate: [], toDelete: ['admin-buy2']})
  })

  it('deletes all quick offers when broadcasting is off', () => {
    expect(
      planQuickOffersReconciliation({
        tradingIntent: 'BOTH',
        quickOffersEnabled: false,
        myQuickOffers: [
          myQuickOffer('buy', 'BUY'),
          myQuickOffer('sell', 'SELL'),
        ],
      })
    ).toEqual({toCreate: [], toDelete: ['admin-buy', 'admin-sell']})
  })
})

describe('quick offers in the offers state', () => {
  const store = createStore()
  store.set(offersAtom, [
    offer({id: 'classic', offerType: 'SELL', isQuickOffer: false, mine: false}),
    offer({id: 'quickBuy', offerType: 'BUY', isQuickOffer: true, mine: false}),
    offer({
      id: 'quickSell',
      offerType: 'SELL',
      isQuickOffer: true,
      mine: false,
    }),
    offer({id: 'myQuick', offerType: 'BUY', isQuickOffer: true, mine: true}),
  ])

  it('are hidden from the marketplace and my offers', () => {
    expect(offerIds(store.get(offersToSeeInMarketplaceAtom))).toEqual([
      'classic',
    ])
    expect(offerIds(store.get(myOffersSortedAtom))).toEqual([])
    expect(store.get(myOffersCountAtom)).toBe(0)
    expect(store.get(areThereAnyMyOffersAtom)).toBe(false)
  })

  it('do not count as stored offers', () => {
    store.set(offersAtom, (offers) =>
      Array.filter(offers, (one) => one.offerInfo.offerId !== 'classic')
    )
    expect(store.get(areThereAnyStoredOffersAtom)).toBe(false)
  })

  it('are available to quick connect by type, mine apart', () => {
    expect(
      pipe(store.get(othersQuickOffersByTypeAtom), ({BUY, SELL}) => ({
        BUY: offerIds(BUY),
        SELL: offerIds(SELL),
      }))
    ).toEqual({BUY: ['quickBuy'], SELL: ['quickSell']})
    expect(offerIds(store.get(myQuickOffersAtom))).toEqual(['myQuick'])
  })
})

describe('reconcileQuickOffersActionAtom', () => {
  const store = createStore()
  let createdCount = 0

  beforeEach(() => {
    createdCount = 0
    mockCreateOffer.mockReset()
    mockDeleteOffers.mockReset()
    mockCreateOffer.mockImplementation(
      async (
        set: Setter,
        params: {payloadPublic: {offerType: OfferType; isQuickOffer: boolean}}
      ) => {
        expect(params.payloadPublic.isQuickOffer).toBe(true)
        await new Promise((resolve) => setTimeout(resolve, 10))
        createdCount += 1
        set(offersAtom, (offers) => [
          ...offers,
          myQuickOffer(
            `created${createdCount}`,
            params.payloadPublic.offerType
          ),
        ])
      }
    )
    mockDeleteOffers.mockImplementation(
      async (set: Setter, {adminIds}: {adminIds: readonly string[]}) => {
        set(offersAtom, (offers) =>
          Array.filter(
            offers,
            (one) => !Array.contains(adminIds, one.ownershipInfo?.adminId ?? '')
          )
        )
      }
    )
    store.set(offersAtom, [])
    store.set(sessionHolderAtom, {
      state: 'loggedIn',
      session: {...dummySession, tradingIntent: 'BOTH'},
    })
  })

  it('creates each quick offer once when runs overlap', async () => {
    await Effect.runPromise(
      Effect.all(
        [
          store.set(reconcileQuickOffersActionAtom),
          store.set(reconcileQuickOffersActionAtom),
          store.set(reconcileQuickOffersActionAtom),
        ],
        {concurrency: 'unbounded'}
      )
    )

    expect(mockCreateOffer).toHaveBeenCalledTimes(2)
    expect(
      Array.map(
        store.get(myQuickOffersAtom),
        (one) => one.offerInfo.publicPart.offerType
      )
    ).toEqual(['BUY', 'SELL'])
  })

  it('does nothing before the usage question is answered', async () => {
    store.set(sessionHolderAtom, {state: 'loggedIn', session: dummySession})

    await Effect.runPromise(store.set(reconcileQuickOffersActionAtom))

    expect(mockCreateOffer).not.toHaveBeenCalled()
  })

  it('keeps going when a creation fails', async () => {
    mockCreateOffer.mockRejectedValueOnce(new Error('offline'))

    await Effect.runPromise(store.set(reconcileQuickOffersActionAtom))

    expect(mockCreateOffer).toHaveBeenCalledTimes(2)
    expect(store.get(myQuickOffersAtom)).toHaveLength(1)
  })

  it('deletes my quick offers when broadcasting is turned off', async () => {
    await Effect.runPromise(store.set(reconcileQuickOffersActionAtom))
    mockCreateOffer.mockClear()

    store.set(sessionHolderAtom, {
      state: 'loggedIn',
      session: {
        ...dummySession,
        tradingIntent: 'BOTH',
        quickOffersEnabled: false,
      },
    })
    await Effect.runPromise(store.set(reconcileQuickOffersActionAtom))

    expect(mockDeleteOffers).toHaveBeenCalledTimes(1)
    expect(store.get(myQuickOffersAtom)).toEqual([])
    expect(mockCreateOffer).not.toHaveBeenCalled()
  })
})
