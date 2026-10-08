import {
  OfferInfo,
  type FriendLevel,
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'
import {mergeIncomingOffersToState} from './mergeIncomingOffersToState'

jest.mock('../../../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const offerPublicKey =
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K'

function makeOfferInfo({
  friendLevel,
  modifiedAt = '2026-01-01T00:00:00.000Z',
  verifiedCommonFriends = [],
  clubIds = [],
}: {
  readonly friendLevel: readonly FriendLevel[]
  readonly modifiedAt?: string
  readonly verifiedCommonFriends?: readonly string[]
  readonly clubIds?: readonly string[]
}): OfferInfo {
  return Schema.decodeSync(OfferInfo)({
    id: 1,
    offerId: 'offer-1',
    privatePart: {
      commonFriends: [],
      verifiedCommonFriends,
      friendLevel,
      symmetricKey: 'symmetric-key',
      clubIds,
    },
    publicPart: {
      offerPublicKey,
      location: [],
      offerDescription: modifiedAt,
      amountBottomLimit: 1,
      amountTopLimit: 2,
      feeState: 'WITHOUT_FEE',
      feeAmount: 0,
      locationState: ['ONLINE'],
      paymentMethod: ['BANK'],
      btcNetwork: ['LIGHTING'],
      currency: 'CZK',
      spokenLanguages: ['ENG'],
      offerType: 'SELL',
      activePriceState: 'NONE',
      activePriceValue: 0,
      activePriceCurrency: 'CZK',
      active: true,
      groupUuids: [],
      listingType: 'BITCOIN',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt,
  })
}

const stored = (offerInfo: OfferInfo): OneOfferInState => ({
  offerInfo,
  flags: {reported: false},
})

const merge = ({
  incomingOffers = [],
  storedOffers,
  removedNearby = [],
  removedContacts = [],
}: {
  incomingOffers?: readonly OfferInfo[]
  storedOffers: OneOfferInState[]
  removedNearby?: readonly OfferId[]
  removedContacts?: readonly OfferId[]
}): ReadonlyArray<readonly FriendLevel[]> =>
  mergeIncomingOffersToState({
    incomingOffers,
    storedOffers,
    removedOffersIds: {
      clubs: [],
      contacts: removedContacts,
      nearby: removedNearby,
    },
  }).map((one) => one.offerInfo.privatePart.friendLevel)

const clubUuid = 'b0f4c7a8-2f3d-4c52-9f5e-3c1d2a4b5e6f'
const contactOffer = makeOfferInfo({friendLevel: ['FIRST_DEGREE']})
const nearbyOffer = makeOfferInfo({friendLevel: ['NEARBY']})

describe('mergeIncomingOffersToState with nearby offers', () => {
  it('adds a new nearby offer', () => {
    expect(merge({incomingOffers: [nearbyOffer], storedOffers: []})).toEqual([
      ['NEARBY'],
    ])
  })

  it('keeps contact source when the same offer is seen nearby', () => {
    expect(
      merge({
        incomingOffers: [nearbyOffer],
        storedOffers: [stored(contactOffer)],
      })
    ).toEqual([['NEARBY', 'FIRST_DEGREE']])
  })

  it('keeps club source when the same offer is seen nearby', () => {
    const [merged] = mergeIncomingOffersToState({
      incomingOffers: [nearbyOffer],
      storedOffers: [
        stored(makeOfferInfo({friendLevel: ['CLUB'], clubIds: [clubUuid]})),
      ],
      removedOffersIds: {clubs: [], contacts: [], nearby: []},
    })
    expect(merged?.offerInfo.privatePart.friendLevel).toEqual([
      'NEARBY',
      'CLUB',
    ])
    expect(merged?.offerInfo.privatePart.clubIds).toEqual([clubUuid])
  })

  it('keeps nearby source when the offer is updated from contacts', () => {
    const updatedContactOffer = makeOfferInfo({
      friendLevel: ['FIRST_DEGREE'],
      modifiedAt: '2026-02-01T00:00:00.000Z',
    })
    expect(
      merge({
        incomingOffers: [updatedContactOffer],
        storedOffers: [
          stored(makeOfferInfo({friendLevel: ['FIRST_DEGREE', 'NEARBY']})),
        ],
      })
    ).toEqual([['FIRST_DEGREE', 'NEARBY']])
  })

  it('keeps verified common friends when the same offer is seen nearby', () => {
    const [merged] = mergeIncomingOffersToState({
      incomingOffers: [nearbyOffer],
      storedOffers: [
        stored(
          makeOfferInfo({
            friendLevel: ['FIRST_DEGREE'],
            verifiedCommonFriends: ['friend-hash'],
          })
        ),
      ],
      removedOffersIds: {clubs: [], contacts: [], nearby: []},
    })
    expect(merged?.offerInfo.privatePart.verifiedCommonFriends).toEqual([
      'friend-hash',
    ])
  })

  it('removes an offer seen only nearby once it is pruned', () => {
    expect(
      merge({
        storedOffers: [stored(nearbyOffer)],
        removedNearby: [nearbyOffer.offerId],
      })
    ).toEqual([])
  })

  it('drops only the nearby source of an offer also shared by contacts', () => {
    expect(
      merge({
        storedOffers: [
          stored(makeOfferInfo({friendLevel: ['FIRST_DEGREE', 'NEARBY']})),
        ],
        removedNearby: [nearbyOffer.offerId],
      })
    ).toEqual([['FIRST_DEGREE']])
  })

  it('keeps the nearby source when contacts stop sharing the offer', () => {
    expect(
      merge({
        storedOffers: [
          stored(makeOfferInfo({friendLevel: ['FIRST_DEGREE', 'NEARBY']})),
        ],
        removedContacts: [nearbyOffer.offerId],
      })
    ).toEqual([['NEARBY']])
  })
})
