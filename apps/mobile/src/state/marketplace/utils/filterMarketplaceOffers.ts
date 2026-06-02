import {
  type OfferLocation,
  type OfferType,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type Viewport} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, pipe} from 'effect'
import {getUserFacingOfferType} from '../../../utils/offerTypeSemantics'
import {type StoredContactWithComputedValues} from '../../contacts/domain'
import {type MarketplaceFilterBarOption, type OffersFilter} from '../domain'
import areIncluded from './areIncluded'
import {
  filterLocationsByCircularLocationFilter,
  isAnyLocationInsideCircularLocationFilter,
} from './circularLocationFilter'
import filterOffersByText from './filterOffersByText'
import {
  isOfferLocationPinInsideViewPort,
  isOfferPinInsideViewPort,
} from './isOfferInsideViewport'

function isViewportTooWide(viewport: Viewport): boolean {
  return (
    Math.abs(viewport.northeast.longitude - viewport.southwest.longitude) > 60
  )
}

export function isAmountFilterEnabled(
  filter: Pick<OffersFilter, 'amountBottomLimit' | 'amountTopLimit'>
): boolean {
  return (
    filter.amountBottomLimit !== undefined ||
    filter.amountTopLimit !== undefined
  )
}

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

function offerMatchesAmountFilter({
  offer,
  filter,
}: {
  offer: OneOfferInState
  filter: OffersFilter
}): boolean {
  if (!isAmountFilterEnabled(filter)) return true

  if (
    filter.currency &&
    filter.currency !== offer.offerInfo.publicPart.currency
  )
    return false

  if (
    filter.amountTopLimit !== undefined &&
    offer.offerInfo.publicPart.amountBottomLimit > filter.amountTopLimit
  )
    return false

  if (
    filter.amountBottomLimit !== undefined &&
    offer.offerInfo.publicPart.amountTopLimit < filter.amountBottomLimit
  )
    return false

  return true
}

export function offerMatchesMarketplaceFilterBarOption(
  offer: OneOfferInState,
  option: MarketplaceFilterBarOption
): boolean {
  const {publicPart} = offer.offerInfo
  const toPersistedOfferType = (userFacingOfferType: OfferType): OfferType =>
    getUserFacingOfferType({
      listingType: publicPart.listingType,
      offerType: userFacingOfferType,
    })

  if (option === 'BUY_BTC')
    return (
      publicPart.offerType === toPersistedOfferType('SELL') && isBtcOffer(offer)
    )

  if (option === 'SELL_BTC')
    return (
      publicPart.offerType === toPersistedOfferType('BUY') && isBtcOffer(offer)
    )

  if (option === 'BUY_PRODUCT')
    return (
      publicPart.offerType === toPersistedOfferType('SELL') &&
      publicPart.listingType === 'PRODUCT'
    )

  if (option === 'SELL_PRODUCT')
    return (
      publicPart.offerType === toPersistedOfferType('BUY') &&
      publicPart.listingType === 'PRODUCT'
    )

  if (option === 'HIRE_SERVICE')
    return (
      publicPart.offerType === toPersistedOfferType('SELL') &&
      publicPart.listingType === 'OTHER'
    )

  return (
    publicPart.offerType === toPersistedOfferType('BUY') &&
    publicPart.listingType === 'OTHER'
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
}: {
  offers: OneOfferInState[]
  filter: OffersFilter
}): OneOfferInState[] {
  const shouldCombineOnlineWithLocation =
    shouldCombineOnlineOffersWithLocationFilter(filter)

  return pipe(
    offers,
    Array.filter((offer) => {
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
          filter.paymentMethod &&
          !shouldCombineOnlineWithLocation &&
          !areIncluded(
            filter.paymentMethod,
            offer.offerInfo.publicPart.paymentMethod
          )
        )
          return false
      }

      return offerMatchesAmountFilter({offer, filter})
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

function isOnlineOffer(offer: OneOfferInState): boolean {
  return offer.offerInfo.publicPart.locationState.includes('ONLINE')
}

export function filterOffersByCircularLocation({
  offers,
  locationFilter,
  includeOnlineOffers = false,
}: {
  offers: OneOfferInState[]
  locationFilter: readonly OfferLocation[] | undefined
  includeOnlineOffers?: boolean
}): OneOfferInState[] {
  if (!Array.isNonEmptyReadonlyArray(locationFilter ?? [])) {
    if (includeOnlineOffers) return offers

    return pipe(
      offers,
      Array.filter((offer) => !isOnlineOffer(offer))
    )
  }

  return pipe(
    offers,
    Array.filter((offer) => {
      if (includeOnlineOffers && isOnlineOffer(offer)) {
        return true
      }

      return isAnyLocationInsideCircularLocationFilter({
        locations: offer.offerInfo.publicPart.location,
        locationFilter,
      })
    })
  )
}

export function filterOffersByPinViewport({
  offers,
  viewport,
  locationFilter,
}: {
  offers: OneOfferInState[]
  viewport: Viewport | undefined
  locationFilter?: readonly OfferLocation[]
}): OneOfferInState[] {
  if (!viewport) return offers

  if (isViewportTooWide(viewport)) return offers

  return pipe(
    offers,
    Array.filter((offer) => {
      if (!Array.isNonEmptyReadonlyArray(locationFilter ?? [])) {
        return isOfferPinInsideViewPort(viewport, offer)
      }

      return pipe(
        filterLocationsByCircularLocationFilter({
          locations: offer.offerInfo.publicPart.location,
          locationFilter,
        }),
        Array.some((location) =>
          isOfferLocationPinInsideViewPort(viewport, location)
        )
      )
    })
  )
}
