import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import {importedContactsAtom} from '../../contacts/atom/contactsStore'
import {createBtcPriceForCurrencyAtom} from '../../currentBtcPriceAtoms'
import {
  filterMarketplaceOffers,
  filterOffersByTextSearch,
  filterOffersByViewport,
  shouldCombineOnlineOffersWithLocationFilter,
} from '../utils/filterMarketplaceOffers'
import sortOffers from '../utils/sortOffers'
import {deltasToViewport, radiusToViewport} from '../utils/toViewport'
import {
  locationFilterAtom,
  offersFilterFromStorageAtom,
  singlePriceCurrencyAtom,
} from './filterAtoms'
import marketplaceLayoutModeAtom from './map/marketplaceLayoutModeAtom'
import {mapRegionAtom} from './mapRegionAtom'
import {offersSelectedByMarketplaceFilterBarOptionsAtom} from './offersByMarketplaceFilterBarOptions'

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

  return filterMarketplaceOffers({
    offers,
    filter,
    layoutMode,
    filterPriceInSats,
    getBtcPriceForCurrency: (currency) =>
      get(createBtcPriceForCurrencyAtom(currency))?.btcPrice?.BTC,
  })
})

/**
 * Filtered offers by every filter except location
 */
export const filteredOffersIgnoreLocationAtom = atom((get) => {
  const filter = get(offersFilterFromStorageAtom)
  const textFilter = filter.text

  const filtered = get(filterMarketplaceOffersAtom)

  const filteredByText = filterOffersByTextSearch({
    text: textFilter,
    offers: filtered,
    importedContacts: get(importedContactsAtom),
  })

  return sortOffers(filteredByText, filter.sort ?? 'NEWEST_OFFER')
})

export const filteredOffersForMapAtom = atom((get) =>
  pipe(
    get(filteredOffersIgnoreLocationAtom),
    Array.filter(
      (offer) => !offer.offerInfo.publicPart.locationState.includes('ONLINE')
    )
  )
)

const viewportToFilterByAtom = atom((get) => {
  const locationFilter = get(locationFilterAtom)

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

const mapViewportToFilterByAtom = atom((get) => {
  const selectedRegion = get(mapRegionAtom)
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

  return undefined
})

export const filteredOffersIncludingLocationFilterAtom = atom((get) => {
  const filter = get(offersFilterFromStorageAtom)
  const filteredOffers = get(filteredOffersIgnoreLocationAtom)

  const offersFilteredBySelectedLocation = filterOffersByViewport({
    offers: filteredOffers,
    viewport: get(viewportToFilterByAtom),
    includeOnlineOffers: shouldCombineOnlineOffersWithLocationFilter(filter),
  })

  return filterOffersByViewport({
    offers: offersFilteredBySelectedLocation,
    viewport: get(mapViewportToFilterByAtom),
  })
})

export const filteredOffersIncludingLocationFilterAtomsAtom = splitAtom(
  filteredOffersIncludingLocationFilterAtom,
  (offer) => offer.offerInfo.offerId
)
