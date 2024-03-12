import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {importedContactsAtom} from '../../contacts/atom/contactsStore'
import filterOffersByText from '../utils/filterOffersByText'
import isOfferInsdieViewPort from '../utils/isOfferInsideViewport'
import sortOffers from '../utils/sortOffers'
import {deltasToViewport, radiusToViewport} from '../utils/toViewport'
import {locationFilterAtom, offersFilterFromStorageAtom} from './filterAtoms'
import marketplaceLayoutModeAtom from './map/marketplaceLayoutModeAtom'
import {mapRegionAtom} from './mapRegionAtom'
import {offersToSeeInMarketplaceAtom} from './offersToSeeInMarketplace'
import visibleMarketplaceSectionAtom from './visibleMarketplaceSectionAtom'

export default function areIncluded<T>(
  elementsToLookFor: T[],
  arrayToLookIn: T[]
): boolean {
  return elementsToLookFor.every((element) => arrayToLookIn.includes(element))
}

/**
 * Filtered offers by every filter except location
 */
export const filteredOffersIgnoreLocationAtom = atom((get) => {
  const offersToSeeInMarketplace = get(offersToSeeInMarketplaceAtom)
  const filter = get(offersFilterFromStorageAtom)
  const textFilter = filter.text
  const layoutMode = get(marketplaceLayoutModeAtom)

  const filtered = offersToSeeInMarketplace.filter(
    (offer) =>
      (!filter.currency ||
        filter.currency.includes(offer.offerInfo.publicPart.currency)) &&
      (layoutMode === 'list' ||
        offer.offerInfo.publicPart.location.length > 0) &&
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

export const countOfFilteredOffersBeforeLocationAtom = atom((get) => {
  const visibleSection = get(visibleMarketplaceSectionAtom)
  return get(filteredOffersIgnoreLocationAtom).filter(
    (one) => one.offerInfo.publicPart.offerType === visibleSection
  ).length
})

const viewportToFilterByAtom = atom((get) => {
  const selectedRegion = get(mapRegionAtom)
  const locationFilter = get(locationFilterAtom)
  const marketplaceLayout = get(marketplaceLayoutModeAtom)

  if (selectedRegion && marketplaceLayout === 'map')
    return deltasToViewport({
      point: {
        ...selectedRegion,
        latitude: Latitude.parse(selectedRegion.latitude),
        longitude: Longitude.parse(selectedRegion.longitude),
      },
      latitudeDelta: selectedRegion.latitudeDelta,
      longitudeDelta: selectedRegion.longitudeDelta,
    })
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

  // Do not filter if user zoomed to too big area
  if (
    viewportToFilterBy.northeast.longitude -
      viewportToFilterBy.southwest.longitude >
    60
  )
    return filteredOffers

  return filteredOffers.filter((one) =>
    isOfferInsdieViewPort(viewportToFilterBy, one)
  )
})

export const filteredOffersSplitByBuySellAtom = atom((get) => {
  const offers = get(filteredOffersIncludingLocationFilterAtom)
  return {
    buy: offers.filter(
      (offer) => offer.offerInfo.publicPart.offerType === 'BUY'
    ),
    sell: offers.filter(
      (offer) => offer.offerInfo.publicPart.offerType === 'SELL'
    ),
  }
})

export const filteredOffersBuyAtom = atom(
  (get) => get(filteredOffersSplitByBuySellAtom).buy
)
export const filteredOffersSellAtom = atom(
  (get) => get(filteredOffersSplitByBuySellAtom).sell
)

export const filteredOffersBuyAtomsAtom = splitAtom(filteredOffersBuyAtom)
export const filteredOffersSellAtomsAtom = splitAtom(filteredOffersSellAtom)
