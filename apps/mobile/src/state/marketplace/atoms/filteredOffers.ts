import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import {importedContactsAtom} from '../../contacts/atom/contactsStore'
import {createBtcPriceForCurrencyAtom} from '../../currentBtcPriceAtoms'
import filterOffersByText from '../utils/filterOffersByText'
import isOfferInsideViewPort from '../utils/isOfferInsideViewport'
import sortOffers from '../utils/sortOffers'
import {deltasToViewport, radiusToViewport} from '../utils/toViewport'
import {
  locationFilterAtom,
  offersFilterFromStorageAtom,
  singlePriceCurrencyAtom,
} from './filterAtoms'
import marketplaceLayoutModeAtom from './map/marketplaceLayoutModeAtom'
import {mapRegionAtom} from './mapRegionAtom'
import {offersToSeeInMarketplaceAtom} from './offersToSeeInMarketplace'

export default function areIncluded<T>(
  elementsToLookFor: T[],
  arrayToLookIn: T[]
): boolean {
  return elementsToLookFor.every((element) => arrayToLookIn.includes(element))
}

const filterBtcOffersAtom = atom((get) => {
  const offersToSeeInMarketplace = get(offersToSeeInMarketplaceAtom)
  const filter = get(offersFilterFromStorageAtom)
  const layoutMode = get(marketplaceLayoutModeAtom)

  return offersToSeeInMarketplace.filter(
    (offer) =>
      (!offer.offerInfo.publicPart.listingType ||
        offer.offerInfo.publicPart.listingType === 'BITCOIN') &&
      (!filter.currency ||
        filter.currency.includes(offer.offerInfo.publicPart.currency)) &&
      (layoutMode === 'list' ||
        offer.offerInfo.publicPart.location.length > 0) &&
      (!filter.locationState ||
        areIncluded(
          filter.locationState,
          offer.offerInfo.publicPart.locationState
        )) &&
      (!filter.paymentMethod ||
        areIncluded(
          filter.paymentMethod,
          offer.offerInfo.publicPart.paymentMethod
        )) &&
      (!filter.btcNetwork ||
        areIncluded(
          filter.btcNetwork,
          offer.offerInfo.publicPart.btcNetwork
        )) &&
      (!filter.friendLevel ||
        (filter.friendLevel.includes('FIRST_DEGREE') &&
        !filter.friendLevel.includes('SECOND_DEGREE')
          ? areIncluded(
              filter.friendLevel,
              offer.offerInfo.privatePart.friendLevel
            )
          : true)) &&
      (!filter.offerType ||
        offer.offerInfo.publicPart.offerType === filter.offerType) &&
      (!filter.amountTopLimit ||
        offer.offerInfo.publicPart.amountBottomLimit <=
          filter.amountTopLimit) &&
      (!filter.amountBottomLimit ||
        offer.offerInfo.publicPart.amountTopLimit >=
          filter.amountBottomLimit) &&
      (filter.spokenLanguages.length === 0 ||
        filter.spokenLanguages.some((item) =>
          offer.offerInfo.publicPart.spokenLanguages.includes(item)
        ))
  )
})

const btcPriceWithStateForFilterCurrencyAtom = createBtcPriceForCurrencyAtom(
  singlePriceCurrencyAtom
)

const filterProductAndOtherOffersAtom = atom((get) => {
  const offersToSeeInMarketplace = get(offersToSeeInMarketplaceAtom)
  const filter = get(offersFilterFromStorageAtom)
  const layoutMode = get(marketplaceLayoutModeAtom)
  const btcPriceWithStateForFilterCurrency = get(
    btcPriceWithStateForFilterCurrencyAtom
  )

  const filterPriceInSats =
    filter.singlePrice &&
    btcPriceWithStateForFilterCurrency &&
    btcPriceWithStateForFilterCurrency.state !== 'loading'
      ? calculatePriceInSats({
          price: filter.singlePrice,
          currentBtcPrice: btcPriceWithStateForFilterCurrency.btcPrice ?? 0,
        })
      : null

  return offersToSeeInMarketplace.filter(
    (offer) =>
      (!filter.listingType ||
        offer.offerInfo.publicPart.listingType === filter.listingType) &&
      (layoutMode === 'list' ||
        offer.offerInfo.publicPart.location.length > 0) &&
      (!filter.locationState ||
        areIncluded(
          filter.locationState,
          offer.offerInfo.publicPart.locationState
        )) &&
      (!filter.btcNetwork ||
        areIncluded(
          filter.btcNetwork,
          offer.offerInfo.publicPart.btcNetwork
        )) &&
      (!filter.friendLevel ||
        (filter.friendLevel.includes('FIRST_DEGREE') &&
        !filter.friendLevel.includes('SECOND_DEGREE')
          ? areIncluded(
              filter.friendLevel,
              offer.offerInfo.privatePart.friendLevel
            )
          : true)) &&
      (!filter.offerType ||
        offer.offerInfo.publicPart.offerType === filter.offerType) &&
      (!filterPriceInSats ||
        (offer.offerInfo.publicPart.amountBottomLimit === 0 &&
          offer.offerInfo.publicPart.amountTopLimit === 0) ||
        (calculatePriceInSats({
          price: offer.offerInfo.publicPart.amountBottomLimit,
          currentBtcPrice:
            get(
              createBtcPriceForCurrencyAtom(offer.offerInfo.publicPart.currency)
            )?.btcPrice ?? 0,
        }) ?? 0) <= filterPriceInSats) &&
      (filter.spokenLanguages.length === 0 ||
        filter.spokenLanguages.some((item) =>
          offer.offerInfo.publicPart.spokenLanguages.includes(item)
        ))
  )
})

/**
 * Filtered offers by every filter except location
 */
export const filteredOffersIgnoreLocationAtom = atom((get) => {
  const filter = get(offersFilterFromStorageAtom)
  const textFilter = filter.text

  const filtered =
    filter.listingType === 'BITCOIN'
      ? get(filterBtcOffersAtom)
      : get(filterProductAndOtherOffersAtom)

  // This could be rewritten with pipe, i know, i know...
  const filteredByText = textFilter
    ? filterOffersByText({
        text: textFilter,
        offers: filtered,
        importedContacts: get(importedContactsAtom),
      })
    : filtered

  return sortOffers(filteredByText, filter.sort ?? 'NEWEST_OFFER')
})

const viewportToFilterByAtom = atom((get) => {
  const selectedRegion = get(mapRegionAtom)
  const locationFilter = get(locationFilterAtom)
  const marketplaceLayout = get(marketplaceLayoutModeAtom)

  if (selectedRegion && marketplaceLayout === 'map') {
    return deltasToViewport({
      point: {
        ...selectedRegion,
        latitude: Latitude.parse(selectedRegion.latitude),
        longitude: Longitude.parse(selectedRegion.longitude),
      },
      latitudeDelta: selectedRegion.latitudeDelta,
      longitudeDelta: selectedRegion.longitudeDelta,
    })
  }

  if (locationFilter) {
    return radiusToViewport({
      point: locationFilter,
      radius: locationFilter.radius,
    })
  }

  return undefined
})

export const filteredOffersIncludingLocationFilterAtom = atom((get) => {
  const viewportToFilterBy = get(viewportToFilterByAtom)
  const filteredOffers = get(filteredOffersIgnoreLocationAtom)

  if (!viewportToFilterBy) return filteredOffers

  // Do not filter if user zoomed out too much
  if (
    Math.abs(
      viewportToFilterBy.northeast.longitude -
        viewportToFilterBy.southwest.longitude
    ) > 60
  )
    return filteredOffers

  return filteredOffers.filter((one) =>
    isOfferInsideViewPort(viewportToFilterBy, one)
  )
})

export const filteredOffersIncludingLocationFilterAtomsAtom = splitAtom(
  filteredOffersIncludingLocationFilterAtom
)
