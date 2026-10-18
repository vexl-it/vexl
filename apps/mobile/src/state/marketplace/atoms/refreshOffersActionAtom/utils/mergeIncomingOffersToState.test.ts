import {OfferInfo} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'
import {mergeIncomingOffersToState} from './mergeIncomingOffersToState'

const offerPublicKey =
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K'

const makeOfferInfo = (privatePart: Record<string, unknown>): OfferInfo =>
  Schema.decodeUnknownSync(OfferInfo)({
    id: 1,
    offerId: 'offer-1',
    privatePart: {
      commonFriends: [],
      symmetricKey: 'symmetric-key',
      clubIds: [],
      ...privatePart,
    },
    publicPart: {
      offerPublicKey,
      location: [],
      offerDescription: 'offer',
      amountBottomLimit: 0,
      amountTopLimit: 100,
      feeState: 'WITHOUT_FEE',
      feeAmount: 0,
      locationState: ['ONLINE'],
      paymentMethod: ['BANK'],
      btcNetwork: ['LIGHTING'],
      currency: 'EUR',
      spokenLanguages: ['ENG'],
      offerType: 'SELL',
      activePriceState: 'NONE',
      activePriceValue: 0,
      activePriceCurrency: 'EUR',
      active: true,
      groupUuids: [],
      listingType: 'BITCOIN',
      vexlNotificationToken: 'vexl_nt_old_device',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
  })

const noRemovedOffers = {clubs: [], contacts: []}

describe('mergeIncomingOffersToState', () => {
  it('restores ownership of an own offer fetched through the owner private part', () => {
    // The owner's own private part carries the admin data but no friend level.
    const ownOffer = makeOfferInfo({
      friendLevel: [],
      adminId: 'admin-id',
      intendedConnectionLevel: 'ALL',
      intendedClubs: [],
    })

    const [merged] = mergeIncomingOffersToState({
      incomingOffers: [ownOffer],
      storedOffers: [],
      removedOffersIds: noRemovedOffers,
    })

    expect(merged?.ownershipInfo).toEqual({
      adminId: 'admin-id',
      intendedConnectionLevel: 'ALL',
      intendedClubs: [],
    })
    // The token belongs to the device that created the offer.
    expect(merged?.offerInfo.publicPart.vexlNotificationToken).toBeUndefined()
  })

  it('still drops foreign offers without any friend level', () => {
    expect(
      mergeIncomingOffersToState({
        incomingOffers: [makeOfferInfo({friendLevel: []})],
        storedOffers: [],
        removedOffersIds: noRemovedOffers,
      })
    ).toEqual([])
  })
})
