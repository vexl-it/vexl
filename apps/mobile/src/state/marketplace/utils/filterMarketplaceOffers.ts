import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Viewport} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, pipe} from 'effect'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import {type StoredContactWithComputedValues} from '../../contacts/domain'
import {type MarketplaceFilterBarOption, type OffersFilter} from '../domain'
import areIncluded from './areIncluded'
import filterOffersByText from './filterOffersByText'
import isOfferInsideViewPort from './isOfferInsideViewport'

export function shouldCombineOnlineOffersWithLocationFilter(
  filter: Pick<OffersFilter, 'location' | 'locationState'>
): boolean {
  return (
    Array.isNonEmptyReadonlyArray(filter.location ?? []) &&
    (filter.locationState?.includes('ONLINE') ?? false)
  )
}

export function isBtcOffer(offer: OneOfferInState): boolean {
  return (
    !offer.offerInfo.publicPart.listingType ||
    offer.offerInfo.publicPart.listingType === 'BITCOIN'
  )
}

export function offerMatchesMarketplaceFilterBarOption(
  offer: OneOfferInState,
  option: MarketplaceFilterBarOption
): boolean {
  if (option === 'BUY_BTC')
    return offer.offerInfo.publicPart.offerType === 'SELL' && isBtcOffer(offer)

  if (option === 'SELL_BTC')
    return offer.offerInfo.publicPart.offerType === 'BUY' && isBtcOffer(offer)

  if (option === 'BUY_PRODUCT')
    return (
      offer.offerInfo.publicPart.offerType === 'SELL' &&
      offer.offerInfo.publicPart.listingType === 'PRODUCT'
    )

  if (option === 'SELL_PRODUCT')
    return (
      offer.offerInfo.publicPart.offerType === 'BUY' &&
      offer.offerInfo.publicPart.listingType === 'PRODUCT'
    )

  if (option === 'HIRE_SERVICE')
    return (
      offer.offerInfo.publicPart.offerType === 'SELL' &&
      offer.offerInfo.publicPart.listingType === 'OTHER'
    )

  return (
    offer.offerInfo.publicPart.offerType === 'BUY' &&
    offer.offerInfo.publicPart.listingType === 'OTHER'
  )
}

export function selectOffersByMarketplaceFilterBarOptions({
  offers,
  selectedOptions,
}: {
  offers: OneOfferInState[]
  selectedOptions: ReadonlySet<MarketplaceFilterBarOption>
}): OneOfferInState[] {
  if (selectedOptions.size === 0) return offers

  return pipe(
    Array.fromIterable(selectedOptions),
    Array.flatMap((option) =>
      pipe(
        offers,
        Array.filter((offer) =>
          offerMatchesMarketplaceFilterBarOption(offer, option)
        )
      )
    )
  )
}

export function filterMarketplaceOffers({
  offers,
  filter,
  layoutMode,
  filterPriceInSats,
  getBtcPriceForCurrency,
}: {
  offers: OneOfferInState[]
  filter: OffersFilter
  layoutMode: 'map' | 'list'
  filterPriceInSats: number | null
  getBtcPriceForCurrency: (currency: CurrencyCode) => number | undefined
}): OneOfferInState[] {
  const shouldCombineOnlineWithLocation =
    shouldCombineOnlineOffersWithLocationFilter(filter)

  return pipe(
    offers,
    Array.filter((offer) => {
      if (
        layoutMode !== 'list' &&
        offer.offerInfo.publicPart.location.length === 0
      )
        return false

      if (
        filter.locationState &&
        !shouldCombineOnlineWithLocation &&
        !areIncluded(
          filter.locationState,
          offer.offerInfo.publicPart.locationState
        )
      )
        return false

      if (
        filter.btcNetwork &&
        !areIncluded(filter.btcNetwork, offer.offerInfo.publicPart.btcNetwork)
      )
        return false

      if (
        filter.friendLevel &&
        Array.some(
          filter.friendLevel,
          (friendLevel) => friendLevel === 'FIRST_DEGREE'
        ) &&
        !Array.some(
          filter.friendLevel,
          (friendLevel) => friendLevel === 'SECOND_DEGREE'
        ) &&
        !areIncluded(
          filter.friendLevel,
          offer.offerInfo.privatePart.friendLevel
        )
      )
        return false

      if (
        filter.spokenLanguages.length > 0 &&
        !Array.some(filter.spokenLanguages, (item) =>
          Array.some(
            offer.offerInfo.publicPart.spokenLanguages,
            (spokenLanguage) => spokenLanguage === item
          )
        )
      )
        return false

      if (
        filter.clubsUuids &&
        offer.offerInfo.privatePart.clubIds.length > 0 &&
        !Array.isNonEmptyArray(
          Array.intersection(
            offer.offerInfo.privatePart.clubIds,
            filter.clubsUuids
          )
        )
      )
        return false

      if (
        filter.productCategories &&
        filter.productCategories.length > 0 &&
        offer.offerInfo.publicPart.listingType === 'PRODUCT' &&
        offer.offerInfo.publicPart.productCategory &&
        !filter.productCategories.includes(
          offer.offerInfo.publicPart.productCategory
        )
      )
        return false

      if (isBtcOffer(offer)) {
        if (
          filter.currency &&
          filter.currency !== offer.offerInfo.publicPart.currency
        )
          return false

        if (
          filter.paymentMethod &&
          !shouldCombineOnlineWithLocation &&
          !areIncluded(
            filter.paymentMethod,
            offer.offerInfo.publicPart.paymentMethod
          )
        )
          return false

        if (
          filter.amountTopLimit &&
          offer.offerInfo.publicPart.amountBottomLimit > filter.amountTopLimit
        )
          return false

        if (
          filter.amountBottomLimit &&
          offer.offerInfo.publicPart.amountTopLimit < filter.amountBottomLimit
        )
          return false

        return true
      }

      if (!filterPriceInSats) return true

      if (
        offer.offerInfo.publicPart.amountBottomLimit === 0 &&
        offer.offerInfo.publicPart.amountTopLimit === 0
      )
        return true

      return (
        (calculatePriceInSats({
          price: offer.offerInfo.publicPart.amountBottomLimit,
          currentBtcPrice:
            getBtcPriceForCurrency(offer.offerInfo.publicPart.currency) ?? 0,
        }) ?? 0) <= filterPriceInSats
      )
    })
  )
}

export function filterOffersByTextSearch({
  offers,
  text,
  importedContacts,
}: {
  offers: OneOfferInState[]
  text: string | undefined
  importedContacts: StoredContactWithComputedValues[]
}): OneOfferInState[] {
  if (!text) return offers

  return filterOffersByText({
    text,
    offers,
    importedContacts,
  })
}

export function filterOffersByViewport({
  offers,
  viewport,
  includeOnlineOffers = false,
}: {
  offers: OneOfferInState[]
  viewport: Viewport | undefined
  includeOnlineOffers?: boolean
}): OneOfferInState[] {
  if (!viewport) return offers

  if (
    Math.abs(viewport.northeast.longitude - viewport.southwest.longitude) > 60
  )
    return offers

  return pipe(
    offers,
    Array.filter((offer) => {
      if (
        includeOnlineOffers &&
        offer.offerInfo.publicPart.locationState.includes('ONLINE')
      ) {
        return true
      }

      return isOfferInsideViewPort(viewport, offer)
    })
  )
}
