import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, Schema} from 'effect'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import {importedContactsAtom} from '../../contacts/atom/contactsStore'
import {createBtcPriceForCurrencyAtom} from '../../currentBtcPriceAtoms'
import areIncluded from '../utils/areIncluded'
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
import {
  isBtcOffer,
  offersSelectedByMarketplaceFilterBarOptionsAtom,
} from './offersByMarketplaceFilterBarOptions'

const btcPriceWithStateForFilterCurrencyAtom = createBtcPriceForCurrencyAtom(
  singlePriceCurrencyAtom
)

const filterMarketplaceOffersAtom = atom((get) => {
  const offers = get(offersSelectedByMarketplaceFilterBarOptionsAtom)
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
          currentBtcPrice:
            btcPriceWithStateForFilterCurrency.btcPrice?.BTC ?? 0,
        })
      : null

  return offers.filter((offer) => {
    if (
      layoutMode !== 'list' &&
      offer.offerInfo.publicPart.location.length === 0
    )
      return false

    if (
      filter.locationState &&
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
      filter.friendLevel.includes('FIRST_DEGREE') &&
      !filter.friendLevel.includes('SECOND_DEGREE') &&
      !areIncluded(filter.friendLevel, offer.offerInfo.privatePart.friendLevel)
    )
      return false

    if (
      filter.spokenLanguages.length > 0 &&
      !filter.spokenLanguages.some((item) =>
        offer.offerInfo.publicPart.spokenLanguages.includes(item)
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

    if (isBtcOffer(offer)) {
      if (
        filter.currency &&
        filter.currency !== offer.offerInfo.publicPart.currency
      )
        return false

      if (
        filter.paymentMethod &&
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
          get(
            createBtcPriceForCurrencyAtom(offer.offerInfo.publicPart.currency)
          )?.btcPrice?.BTC ?? 0,
      }) ?? 0) <= filterPriceInSats
    )
  })
})

/**
 * Filtered offers by every filter except location
 */
export const filteredOffersIgnoreLocationAtom = atom((get) => {
  const filter = get(offersFilterFromStorageAtom)
  const textFilter = filter.text

  const filtered = get(filterMarketplaceOffersAtom)

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
        latitude: Schema.decodeSync(Latitude)(selectedRegion.latitude),
        longitude: Schema.decodeSync(Longitude)(selectedRegion.longitude),
      },
      latitudeDelta: selectedRegion.latitudeDelta,
      longitudeDelta: selectedRegion.longitudeDelta,
    })
  }

  if (locationFilter) {
    return radiusToViewport(
      locationFilter.map((one) => ({
        point: {latitude: one.latitude, longitude: one.longitude},
        radius: one.radius,
      }))
    )
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
  filteredOffersIncludingLocationFilterAtom,
  (offer) => offer.offerInfo.offerId
)
