import {OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, pipe, Schema} from 'effect'
import {type OffersFilter} from '../domain'
import {filterMarketplaceOffers} from './filterMarketplaceOffers'

const offerPublicKey =
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K'

function makeOffer({
  id,
  listingType,
  currency,
  amountBottomLimit,
  amountTopLimit,
}: {
  readonly id: string
  readonly listingType: 'BITCOIN' | 'PRODUCT' | 'OTHER'
  readonly currency: 'CZK' | 'EUR'
  readonly amountBottomLimit: number
  readonly amountTopLimit: number
}): Schema.Schema.Type<typeof OneOfferInState> {
  return Schema.decodeSync(OneOfferInState)({
    offerInfo: {
      id: 1,
      offerId: id,
      privatePart: {
        commonFriends: [],
        verifiedCommonFriends: [],
        friendLevel: ['FIRST_DEGREE'],
        symmetricKey: 'symmetric-key',
        clubIds: [],
      },
      publicPart: {
        offerPublicKey,
        location: [],
        offerDescription: id,
        amountBottomLimit,
        amountTopLimit,
        feeState: 'WITHOUT_FEE',
        feeAmount: 0,
        locationState: ['ONLINE'],
        paymentMethod: ['BANK'],
        btcNetwork: ['LIGHTING'],
        currency,
        spokenLanguages: ['ENG'],
        offerType: 'SELL',
        activePriceState: 'NONE',
        activePriceValue: 0,
        activePriceCurrency: currency,
        active: true,
        groupUuids: [],
        listingType,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      modifiedAt: '2026-01-01T00:00:00.000Z',
    },
    flags: {},
  })
}

function filterOfferIds({
  filter,
}: {
  readonly filter: OffersFilter
}): readonly string[] {
  return pipe(
    filterMarketplaceOffers({
      offers: [
        makeOffer({
          id: 'btc-overlap',
          listingType: 'BITCOIN',
          currency: 'CZK',
          amountBottomLimit: 5_000,
          amountTopLimit: 20_000,
        }),
        makeOffer({
          id: 'product-inside',
          listingType: 'PRODUCT',
          currency: 'CZK',
          amountBottomLimit: 20_000,
          amountTopLimit: 20_000,
        }),
        makeOffer({
          id: 'service-outside',
          listingType: 'OTHER',
          currency: 'CZK',
          amountBottomLimit: 60_000,
          amountTopLimit: 60_000,
        }),
        makeOffer({
          id: 'service-wrong-currency',
          listingType: 'OTHER',
          currency: 'EUR',
          amountBottomLimit: 20_000,
          amountTopLimit: 20_000,
        }),
      ],
      filter,
    }),
    Array.map((offer) => offer.offerInfo.offerId)
  )
}

describe('filterMarketplaceOffers amount filter', () => {
  test('matches BTC, product, and service offers by currency and range overlap', () => {
    expect(
      filterOfferIds({
        filter: {
          filterBarOptions: new Set(),
          spokenLanguages: [],
          currency: 'CZK',
          amountBottomLimit: 10_000,
          amountTopLimit: 50_000,
        },
      })
    ).toEqual(['btc-overlap', 'product-inside'])
  })

  test('keeps every listing type when amount filter is inactive', () => {
    expect(
      filterOfferIds({
        filter: {
          filterBarOptions: new Set(),
          spokenLanguages: [],
        },
      })
    ).toEqual([
      'btc-overlap',
      'product-inside',
      'service-outside',
      'service-wrong-currency',
    ])
  })
})
