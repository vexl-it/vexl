import {
  OneOfferInState,
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'
import {getOtherPersonRole, type OtherPersonRole} from './otherPersonRole'

jest.mock('./localization/formattingLocaleAtom', () => ({}))

function makeOffer({
  mine,
  listingType,
  offerType,
}: {
  mine: boolean
  listingType: ListingType
  offerType: OfferType
}): OneOfferInState {
  return Schema.decodeUnknownSync(OneOfferInState)({
    offerInfo: {
      id: 1,
      offerId: 'offer-id',
      privatePart: {
        commonFriends: [],
        friendLevel: [],
        symmetricKey: 'key',
        clubIds: [],
      },
      publicPart: {
        offerPublicKey: 'public-key',
        location: [],
        offerDescription: 'offer',
        amountBottomLimit: 0,
        amountTopLimit: 100,
        feeState: 'WITHOUT_FEE',
        feeAmount: 0,
        locationState: ['ONLINE'],
        paymentMethod: ['BANK'],
        btcNetwork: ['LIGHTING'],
        currency: 'CZK',
        spokenLanguages: ['ENG'],
        offerType,
        activePriceState: 'NONE',
        activePriceValue: 0,
        activePriceCurrency: 'CZK',
        active: true,
        groupUuids: [],
        listingType,
      },
      createdAt: '2026-10-01T00:00:00.000Z',
      modifiedAt: '2026-10-01T00:00:00.000Z',
    },
    flags: {},
    ownershipInfo: mine
      ? {adminId: 'admin-id', intendedConnectionLevel: 'ALL'}
      : undefined,
  })
}

it('returns otherPerson when the chat has no resolvable offer', () => {
  expect(getOtherPersonRole(undefined)).toBe('otherPerson')
})

it.each<{
  mine: boolean
  listingType: ListingType
  offerType: OfferType
  expected: OtherPersonRole
}>([
  {mine: false, listingType: 'BITCOIN', offerType: 'SELL', expected: 'seller'},
  {mine: false, listingType: 'BITCOIN', offerType: 'BUY', expected: 'buyer'},
  {mine: false, listingType: 'PRODUCT', offerType: 'BUY', expected: 'seller'},
  {mine: false, listingType: 'PRODUCT', offerType: 'SELL', expected: 'buyer'},
  {mine: false, listingType: 'OTHER', offerType: 'BUY', expected: 'seller'},
  {mine: false, listingType: 'OTHER', offerType: 'SELL', expected: 'buyer'},
  {mine: true, listingType: 'BITCOIN', offerType: 'SELL', expected: 'buyer'},
  {mine: true, listingType: 'BITCOIN', offerType: 'BUY', expected: 'seller'},
  {mine: true, listingType: 'PRODUCT', offerType: 'BUY', expected: 'buyer'},
  {mine: true, listingType: 'PRODUCT', offerType: 'SELL', expected: 'seller'},
  {mine: true, listingType: 'OTHER', offerType: 'BUY', expected: 'buyer'},
  {mine: true, listingType: 'OTHER', offerType: 'SELL', expected: 'seller'},
])(
  'returns $expected for $listingType $offerType (mine: $mine)',
  ({expected, ...params}) => {
    expect(getOtherPersonRole(makeOffer(params))).toBe(expected)
  }
)
