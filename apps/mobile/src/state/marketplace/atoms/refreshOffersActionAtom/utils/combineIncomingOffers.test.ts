import {KeyHolder} from '@vexl-next/cryptography'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  OfferInfo,
  type OfferPrivatePart,
} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'
import {toIncomingOffers} from './combineIncomingOffers'

jest.mock('../../../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const hash = Schema.decodeSync(HashedPhoneNumber)
const club = Schema.decodeSync(ClubUuid)('00000000-0000-4000-8000-000000000001')
const mainIdentity = KeyHolder.generatePrivateKey().publicKeyPemBase64
const extraIdentity = KeyHolder.generatePrivateKey().publicKeyPemBase64

const makeOffer = (privatePart: Partial<OfferPrivatePart>): OfferInfo =>
  Schema.decodeSync(OfferInfo)({
    id: 1,
    offerId: 'offer',
    privatePart: {
      symmetricKey: 'symmetric-key',
      friendLevel: [],
      clubIds: [],
      commonFriends: [],
      verifiedCommonFriends: [],
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

it('merges the same offer received by two phone numbers, keeping verified common friends of both', () => {
  const [incoming, ...rest] = toIncomingOffers({
    contactOffers: [
      {
        identity: mainIdentity,
        offerInfo: makeOffer({
          friendLevel: ['SECOND_DEGREE'],
          commonFriends: [hash('a'), hash('b')],
          verifiedCommonFriends: [hash('a')],
        }),
      },
      {
        identity: extraIdentity,
        offerInfo: makeOffer({
          friendLevel: ['FIRST_DEGREE'],
          commonFriends: [hash('b'), hash('c')],
          verifiedCommonFriends: [hash('c')],
        }),
      },
    ],
    clubOffers: [makeOffer({friendLevel: ['CLUB'], clubIds: [club]})],
  })

  expect(rest).toEqual([])
  expect(incoming?.offerInfo.privatePart).toMatchObject({
    friendLevel: ['SECOND_DEGREE', 'FIRST_DEGREE', 'CLUB'],
    commonFriends: [hash('a'), hash('b'), hash('c')],
    verifiedCommonFriends: [hash('a'), hash('c')],
    clubIds: [club],
  })
  expect(incoming?.socialPartsByIdentity).toEqual({
    [mainIdentity]: {
      friendLevel: ['SECOND_DEGREE'],
      commonFriends: [hash('a'), hash('b')],
      verifiedCommonFriends: [hash('a')],
    },
    [extraIdentity]: {
      friendLevel: ['FIRST_DEGREE'],
      commonFriends: [hash('b'), hash('c')],
      verifiedCommonFriends: [hash('c')],
    },
  })
})

it('unions the parts one phone number got for its V1 and V2 key', () => {
  const [incoming] = toIncomingOffers({
    contactOffers: [
      {
        identity: mainIdentity,
        offerInfo: makeOffer({
          friendLevel: ['SECOND_DEGREE'],
          commonFriends: [hash('a')],
        }),
      },
      {
        identity: mainIdentity,
        offerInfo: makeOffer({
          friendLevel: ['SECOND_DEGREE'],
          commonFriends: [hash('b')],
        }),
      },
    ],
    clubOffers: [],
  })

  expect(incoming?.socialPartsByIdentity).toEqual({
    [mainIdentity]: {
      friendLevel: ['SECOND_DEGREE'],
      commonFriends: [hash('a'), hash('b')],
      verifiedCommonFriends: [],
    },
  })
})
