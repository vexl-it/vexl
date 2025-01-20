import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {type LatLong} from '@vexl-next/domain/src/utility/geoCoordinates'
import {atom} from 'jotai'
import europeRegion from '../../../../components/Map/utils/europeRegion'
import getOfferLocationBorderPoints from '../../utils/getOfferLocationBorderPoints'
import {locationFilterAtom, resetLocationFilterActionAtom} from '../filterAtoms'
import {filteredOffersIgnoreLocationAtom} from '../filteredOffers'
import {mapRegionAtom} from '../mapRegionAtom'
import {offersAtom} from '../offersState'
import {
  animateToCoordinateActionAtom,
  animateToOfferActionAtom,
  animateToRegionActionAtom,
} from './mapViewAtoms'

export const focusedOfferIdAtom = atom<OfferId | null>(null)
export const focusedOfferAtom = atom((get) => {
  const id = get(focusedOfferIdAtom)
  return get(offersAtom).find((one) => one.offerInfo.offerId === id)
})

export const refocusMapActionAtom = atom(
  null,
  (get, set, {focusAllOffers}: {focusAllOffers: boolean}) => {
    const focusedOffer = get(focusedOfferAtom)
    if (focusedOffer) {
      set(animateToOfferActionAtom, focusedOffer)
      return
    }

    if (focusAllOffers) {
      set(mapRegionAtom, null)
      set(resetLocationFilterActionAtom)
      const offers = get(filteredOffersIgnoreLocationAtom)
      if (offers.length > 0) {
        const borderPoints = offers.flatMap((one) =>
          one.offerInfo.publicPart.location.flatMap(
            getOfferLocationBorderPoints
          )
        )
        set(animateToCoordinateActionAtom, borderPoints)
        return
      }
    }

    const mapRegion = get(mapRegionAtom)
    if (mapRegion) {
      set(animateToRegionActionAtom, mapRegion)
      return
    }

    const locationFilter = get(locationFilterAtom)
    if (locationFilter) {
      const oneLocation = locationFilter[0]
      const coordinates: LatLong[] = locationFilter.map((one) => ({
        latitude: one.latitude,
        longitude: one.longitude,
      }))

      if (coordinates.length === 1 && oneLocation) {
        // this should avoid zooming too much on filtered location if there is only one
        set(
          animateToCoordinateActionAtom,
          getOfferLocationBorderPoints(oneLocation)
        )
        return
      }

      set(animateToCoordinateActionAtom, coordinates)
      return
    }

    const offers = get(filteredOffersIgnoreLocationAtom)

    if (offers.length > 0) {
      const borderPoints = offers.flatMap((one) =>
        one.offerInfo.publicPart.location.flatMap(getOfferLocationBorderPoints)
      )
      set(animateToCoordinateActionAtom, borderPoints)
      return
    }

    set(animateToRegionActionAtom, europeRegion)
  }
)

export const clearRegionAndRefocusActionAtom = atom(null, (get, set) => {
  set(mapRegionAtom, null)
  set(refocusMapActionAtom, {focusAllOffers: false})
})

export const focusOfferActionAtom = atom(
  null,
  (get, set, offerId: OfferId | null) => {
    set(focusedOfferIdAtom, offerId)
    set(refocusMapActionAtom, {focusAllOffers: false})
  }
)
