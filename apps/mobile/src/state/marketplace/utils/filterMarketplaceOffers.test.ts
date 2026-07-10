import {
  OneOfferInState,
  type OfferMarkType,
  type OfferType,
  type ProductCategory,
} from '@vexl-next/domain/src/general/offers'
import {Array, pipe, Schema} from 'effect'
import {
  type MarketplaceFilterBarOption,
  type MarketplaceVisibleSection,
  type OffersFilter,
} from '../domain'
import {
  filterMarketplaceOffers,
  filterOffersByVisibleSection,
  selectOffersByMarketplaceFilterBarOptions,
} from './filterMarketplaceOffers'

const offerPublicKey =
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K'

function makeOffer({
  id,
  listingType,
  currency,
  amountBottomLimit,
  amountTopLimit,
  offerType = 'SELL',
  productCategory,
  productCategories,
  markType,
}: {
  readonly id: string
  readonly listingType: 'BITCOIN' | 'PRODUCT' | 'OTHER'
  readonly currency: 'CZK' | 'EUR'
  readonly amountBottomLimit: number
  readonly amountTopLimit: number
  readonly offerType?: OfferType
  readonly productCategory?: ProductCategory
  readonly productCategories?: readonly ProductCategory[]
  readonly markType?: OfferMarkType
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
        offerType,
        activePriceState: 'NONE',
        activePriceValue: 0,
        activePriceCurrency: currency,
        active: true,
        groupUuids: [],
        listingType,
        productCategory,
        productCategories,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      modifiedAt: '2026-01-01T00:00:00.000Z',
    },
    flags:
      markType === undefined
        ? {}
        : {mark: {type: markType, markedAt: '2026-01-01T00:00:00.000Z'}},
  })
}

function filterOfferIdsFromOffers({
  offers,
  filter,
}: {
  readonly offers: OneOfferInState[]
  readonly filter: OffersFilter
}): readonly string[] {
  return pipe(
    filterMarketplaceOffers({
      offers,
      filter,
    }),
    Array.map((offer) => offer.offerInfo.offerId)
  )
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

function filterOfferIdsByVisibleSection(
  visibleSection: MarketplaceVisibleSection
): readonly string[] {
  return pipe(
    filterOffersByVisibleSection({
      offers: [
        makeOffer({
          id: 'favourite',
          listingType: 'BITCOIN',
          currency: 'CZK',
          amountBottomLimit: 20_000,
          amountTopLimit: 20_000,
          markType: 'FAVOURITE',
        }),
        makeOffer({
          id: 'archived',
          listingType: 'BITCOIN',
          currency: 'CZK',
          amountBottomLimit: 20_000,
          amountTopLimit: 20_000,
          markType: 'ARCHIVED',
        }),
        makeOffer({
          id: 'unmarked',
          listingType: 'BITCOIN',
          currency: 'CZK',
          amountBottomLimit: 20_000,
          amountTopLimit: 20_000,
        }),
      ],
      visibleSection,
    }),
    Array.map((offer) => offer.offerInfo.offerId)
  )
}

describe('filterOffersByVisibleSection', () => {
  test('keeps favourite, archived, and unmarked offers for ALL', () => {
    expect(filterOfferIdsByVisibleSection('ALL')).toEqual([
      'favourite',
      'archived',
      'unmarked',
    ])
  })

  test('keeps only favourite offers for ONLY_FAVOURITES', () => {
    expect(filterOfferIdsByVisibleSection('ONLY_FAVOURITES')).toEqual([
      'favourite',
    ])
  })

  test('keeps only archived offers for ONLY_ARCHIVED', () => {
    expect(filterOfferIdsByVisibleSection('ONLY_ARCHIVED')).toEqual([
      'archived',
    ])
  })
})

describe('filterMarketplaceOffers product category filter', () => {
  test('matches product offers by plural productCategories', () => {
    expect(
      filterOfferIdsFromOffers({
        offers: [
          makeOffer({
            id: 'product-electronics',
            listingType: 'PRODUCT',
            currency: 'CZK',
            amountBottomLimit: 20_000,
            amountTopLimit: 20_000,
            productCategories: ['ELECTRONICS'],
          }),
        ],
        filter: {
          filterBarOptions: new Set(),
          visibleSection: 'ALL',
          spokenLanguages: [],
          productCategories: ['ELECTRONICS'],
        },
      })
    ).toEqual(['product-electronics'])
  })

  test('excludes product offers when plural productCategories do not match', () => {
    expect(
      filterOfferIdsFromOffers({
        offers: [
          makeOffer({
            id: 'product-produce',
            listingType: 'PRODUCT',
            currency: 'CZK',
            amountBottomLimit: 20_000,
            amountTopLimit: 20_000,
            productCategories: ['PRODUCE'],
          }),
        ],
        filter: {
          filterBarOptions: new Set(),
          visibleSection: 'ALL',
          spokenLanguages: [],
          productCategories: ['ELECTRONICS'],
        },
      })
    ).toEqual([])
  })

  test('matches product offers by legacy singular productCategory', () => {
    expect(
      filterOfferIdsFromOffers({
        offers: [
          makeOffer({
            id: 'legacy-product-electronics',
            listingType: 'PRODUCT',
            currency: 'CZK',
            amountBottomLimit: 20_000,
            amountTopLimit: 20_000,
            productCategory: 'ELECTRONICS',
          }),
        ],
        filter: {
          filterBarOptions: new Set(),
          visibleSection: 'ALL',
          spokenLanguages: [],
          productCategories: ['ELECTRONICS'],
        },
      })
    ).toEqual(['legacy-product-electronics'])
  })

  test('excludes product offers missing categories when category filter is active', () => {
    expect(
      filterOfferIdsFromOffers({
        offers: [
          makeOffer({
            id: 'product-missing-category',
            listingType: 'PRODUCT',
            currency: 'CZK',
            amountBottomLimit: 20_000,
            amountTopLimit: 20_000,
          }),
        ],
        filter: {
          filterBarOptions: new Set(),
          visibleSection: 'ALL',
          spokenLanguages: [],
          productCategories: ['OTHERS'],
        },
      })
    ).toEqual([])
  })
})

describe('filterMarketplaceOffers amount filter', () => {
  test('matches BTC, product, and service offers by currency and range overlap', () => {
    expect(
      filterOfferIds({
        filter: {
          filterBarOptions: new Set(),
          visibleSection: 'ALL',
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
          visibleSection: 'ALL',
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

describe('selectOffersByMarketplaceFilterBarOptions', () => {
  test('matches product and service options using the persisted Bitcoin-leg offer type', () => {
    const offers = [
      makeOffer({
        id: 'product-seller',
        listingType: 'PRODUCT',
        currency: 'CZK',
        amountBottomLimit: 20_000,
        amountTopLimit: 20_000,
        offerType: 'BUY',
      }),
      makeOffer({
        id: 'product-buyer',
        listingType: 'PRODUCT',
        currency: 'CZK',
        amountBottomLimit: 20_000,
        amountTopLimit: 20_000,
        offerType: 'SELL',
      }),
      makeOffer({
        id: 'service-provider',
        listingType: 'OTHER',
        currency: 'CZK',
        amountBottomLimit: 20_000,
        amountTopLimit: 20_000,
        offerType: 'BUY',
      }),
      makeOffer({
        id: 'service-hirer',
        listingType: 'OTHER',
        currency: 'CZK',
        amountBottomLimit: 20_000,
        amountTopLimit: 20_000,
        offerType: 'SELL',
      }),
    ]

    expect(
      pipe(
        selectOffersByMarketplaceFilterBarOptions({
          offers,
          selectedOptions: new Set<MarketplaceFilterBarOption>([
            'BUY_PRODUCT',
            'HIRE_SERVICE',
          ]),
        }),
        Array.map((offer) => offer.offerInfo.offerId)
      )
    ).toEqual(['product-seller', 'service-provider'])

    expect(
      pipe(
        selectOffersByMarketplaceFilterBarOptions({
          offers,
          selectedOptions: new Set<MarketplaceFilterBarOption>([
            'SELL_PRODUCT',
            'PROVIDE_SERVICE',
          ]),
        }),
        Array.map((offer) => offer.offerInfo.offerId)
      )
    ).toEqual(['product-buyer', 'service-hirer'])
  })
})
