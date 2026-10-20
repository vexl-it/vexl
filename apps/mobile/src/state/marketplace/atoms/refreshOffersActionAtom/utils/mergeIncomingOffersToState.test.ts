import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  OfferAdminId,
  OfferInfo,
  type OfferPrivatePart,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'
import {mergeIncomingOffersToState} from './mergeIncomingOffersToState'

const clubA = Schema.decodeSync(ClubUuid)(
  '00000000-0000-4000-8000-000000000001'
)
const clubB = Schema.decodeSync(ClubUuid)(
  '00000000-0000-4000-8000-000000000002'
)
const oldFriend = Schema.decodeSync(HashedPhoneNumber)('old-friend')
const newFriend = Schema.decodeSync(HashedPhoneNumber)('new-friend')
const adminId = Schema.decodeSync(OfferAdminId)('owner-admin-id')

function makeOffer(privatePart: Partial<OfferPrivatePart> = {}): OfferInfo {
  return Schema.decodeSync(OfferInfo)({
    id: 1,
    offerId: 'offer',
    privatePart: {
      symmetricKey: 'symmetric-key',
      friendLevel: ['SECOND_DEGREE', 'CLUB'],
      clubIds: [clubA],
      commonFriends: [oldFriend],
      verifiedCommonFriends: [oldFriend],
      ...privatePart,
    },
    publicPart: {
      offerPublicKey:
        'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K',
      location: [],
      offerDescription: 'Offer',
      amountBottomLimit: 100,
      amountTopLimit: 200,
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
    modifiedAt: '2026-01-01T00:00:00.000Z',
  })
}

const storedOffer: OneOfferInState = {
  offerInfo: makeOffer(),
  flags: {reported: true},
}
const socialUpdate = makeOffer({
  friendLevel: ['FIRST_DEGREE'],
  clubIds: [],
  commonFriends: [newFriend],
  verifiedCommonFriends: [],
})
const clubUpdate = makeOffer({
  friendLevel: ['CLUB'],
  clubIds: [clubB],
  commonFriends: [],
  verifiedCommonFriends: [],
})
const noRemovals = {contacts: [], clubs: []}

it.each([{commonFriends: [newFriend]}, {commonFriends: []}])(
  'preserves clubs while replacing social fields with $commonFriends',
  ({commonFriends}) => {
    const incomingOffer = {
      ...socialUpdate,
      privatePart: {...socialUpdate.privatePart, commonFriends},
    }
    const result = mergeIncomingOffersToState({
      storedOffers: [storedOffer],
      incomingOffers: [incomingOffer],
      removedOffersIds: noRemovals,
    })

    expect(result[0]?.offerInfo.privatePart).toMatchObject({
      friendLevel: ['FIRST_DEGREE', 'CLUB'],
      clubIds: [clubA],
      commonFriends,
      verifiedCommonFriends: [],
    })
    expect(result[0]?.flags).toBe(storedOffer.flags)
    expect(result[0]?.offerInfo.publicPart).toBe(incomingOffer.publicPart)
    expect(
      mergeIncomingOffersToState({
        storedOffers: result,
        incomingOffers: [],
        removedOffersIds: noRemovals,
      })
    ).toBe(result)
  }
)

it('preserves social fields and other clubs on a club-only update', () => {
  const result = mergeIncomingOffersToState({
    storedOffers: [storedOffer],
    incomingOffers: [clubUpdate],
    removedOffersIds: noRemovals,
  })

  expect(result[0]?.offerInfo.privatePart).toMatchObject({
    friendLevel: ['SECOND_DEGREE', 'CLUB'],
    clubIds: [clubA, clubB],
    commonFriends: [oldFriend],
    verifiedCommonFriends: [oldFriend],
  })
  expect(result[0]?.offerInfo.publicPart).toBe(clubUpdate.publicPart)
})

it('replaces social fields in a mixed update without losing unchanged clubs', () => {
  const result = mergeIncomingOffersToState({
    storedOffers: [storedOffer],
    incomingOffers: [
      makeOffer({
        ...socialUpdate.privatePart,
        friendLevel: ['FIRST_DEGREE', 'CLUB'],
        clubIds: [clubB],
      }),
    ],
    removedOffersIds: noRemovals,
  })

  expect(result[0]?.offerInfo.privatePart).toMatchObject({
    friendLevel: ['FIRST_DEGREE', 'CLUB'],
    clubIds: [clubA, clubB],
    commonFriends: [newFriend],
    verifiedCommonFriends: [],
  })
})

it('does not duplicate clubs when their copy is refreshed', () => {
  const incoming = makeOffer({
    ...clubUpdate.privatePart,
    clubIds: [clubA],
  })
  const result = mergeIncomingOffersToState({
    storedOffers: [storedOffer],
    incomingOffers: [incoming],
    removedOffersIds: noRemovals,
  })
  expect(result[0]?.offerInfo.privatePart.clubIds).toEqual([clubA])
})

it.each([
  {update: 'none', incomingOffers: []},
  {update: 'social', incomingOffers: [socialUpdate]},
])('honors club removal with a $update update', ({incomingOffers}) => {
  const result = mergeIncomingOffersToState({
    storedOffers: [storedOffer],
    incomingOffers,
    removedOffersIds: {
      contacts: [],
      clubs: [{clubUuid: clubA, removedIds: [storedOffer.offerInfo.offerId]}],
    },
  })
  expect(result[0]?.offerInfo.privatePart.clubIds).toEqual([])
  expect(result[0]?.offerInfo.privatePart.friendLevel).not.toContain('CLUB')
})

it.each([
  {update: 'none', incomingOffers: []},
  {update: 'club', incomingOffers: [clubUpdate]},
])(
  'clears revoked social information with a $update update',
  ({incomingOffers}) => {
    const result = mergeIncomingOffersToState({
      storedOffers: [storedOffer],
      incomingOffers,
      removedOffersIds: {
        contacts: [storedOffer.offerInfo.offerId],
        clubs: [],
      },
    })
    expect(result[0]?.offerInfo.privatePart).toMatchObject({
      friendLevel: ['CLUB'],
      commonFriends: [],
      verifiedCommonFriends: [],
    })
    expect(result[0]?.offerInfo.privatePart.clubIds).toContain(clubA)
  }
)

it('removes an offer after its last source is revoked', () => {
  expect(
    mergeIncomingOffersToState({
      storedOffers: [storedOffer],
      incomingOffers: [],
      removedOffersIds: {
        contacts: [storedOffer.offerInfo.offerId],
        clubs: [{clubUuid: clubA, removedIds: [storedOffer.offerInfo.offerId]}],
      },
    })
  ).toEqual([])
})

it('preserves references on an empty refresh', () => {
  const storedOffers = [storedOffer]
  expect(
    mergeIncomingOffersToState({
      storedOffers,
      incomingOffers: [],
      removedOffersIds: noRemovals,
    })
  ).toBe(storedOffers)
})

it('adds a new offer without inventing other sources', () => {
  const result = mergeIncomingOffersToState({
    storedOffers: [],
    incomingOffers: [clubUpdate],
    removedOffersIds: noRemovals,
  })
  expect(result[0]?.offerInfo).toBe(clubUpdate)
})

it('leaves owned offers untouched', () => {
  const ownedOffer: OneOfferInState = {
    ...storedOffer,
    ownershipInfo: {
      adminId,
      intendedClubs: [clubA],
      intendedConnectionLevel: 'ALL',
    },
  }
  const result = mergeIncomingOffersToState({
    storedOffers: [ownedOffer],
    incomingOffers: [socialUpdate],
    removedOffersIds: {
      contacts: [ownedOffer.offerInfo.offerId],
      clubs: [{clubUuid: clubA, removedIds: [ownedOffer.offerInfo.offerId]}],
    },
  })
  expect(result[0]).toBe(ownedOffer)
})

it('restores ownership from the owner payload without retaining foreign sources', () => {
  const incomingOffer = makeOffer({
    adminId,
    intendedConnectionLevel: 'ALL',
    intendedClubs: [clubB],
    friendLevel: ['NOT_SPECIFIED'],
    clubIds: [],
    commonFriends: [],
    verifiedCommonFriends: [],
  })
  const result = mergeIncomingOffersToState({
    storedOffers: [storedOffer],
    incomingOffers: [incomingOffer],
    removedOffersIds: noRemovals,
  })
  expect(result[0]?.offerInfo).toBe(incomingOffer)
  expect(result[0]?.ownershipInfo).toEqual({
    adminId,
    intendedConnectionLevel: 'ALL',
    intendedClubs: [clubB],
  })
})
