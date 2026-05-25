import {
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type LatLong} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import europeRegion from '../../../../components/Map/utils/europeRegion'
import {filterLocationsByCircularLocationFilter} from '../../utils/circularLocationFilter'
import getOfferLocationBorderPoints from '../../utils/getOfferLocationBorderPoints'
import {locationFilterAtom, resetLocationFilterActionAtom} from '../filterAtoms'
import {filteredOffersForMapAtom} from '../filteredOffers'
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
      const offers = get(filteredOffersForMapAtom)
      if (offers.length > 0) {
        const locationFilter = get(locationFilterAtom)
        const borderPoints = pipe(
          offers,
          Array.flatMap((one: OneOfferInState) =>
            pipe(
              filterLocationsByCircularLocationFilter({
                locations: one.offerInfo.publicPart.location,
                locationFilter,
              }),
              Array.flatMap(getOfferLocationBorderPoints)
            )
          )
        )
        if (Array.isNonEmptyReadonlyArray(borderPoints)) {
          set(animateToCoordinateActionAtom, borderPoints)
          return
        }
      }
    }

    const mapRegion = get(mapRegionAtom)
    if (mapRegion) {
      set(animateToRegionActionAtom, mapRegion)
      return
    }

    const locationFilter = get(locationFilterAtom)
    if (locationFilter && locationFilter.length > 0) {
      const oneLocation = locationFilter[0]
      const coordinates: LatLong[] = pipe(
        locationFilter,
        Array.map((one) => ({
          latitude: one.latitude,
          longitude: one.longitude,
        }))
      )

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

    const offers = get(filteredOffersForMapAtom)

    if (offers.length > 0) {
      const locationFilter = get(locationFilterAtom)
      const borderPoints = pipe(
        offers,
        Array.flatMap((one: OneOfferInState) =>
          pipe(
            filterLocationsByCircularLocationFilter({
              locations: one.offerInfo.publicPart.location,
              locationFilter,
            }),
            Array.flatMap(getOfferLocationBorderPoints)
          )
        )
      )
      if (Array.isNonEmptyReadonlyArray(borderPoints)) {
        set(animateToCoordinateActionAtom, borderPoints)
        return
      }
    }

    set(animateToRegionActionAtom, europeRegion)
  }
)

export const focusOfferActionAtom = atom(
  null,
  (get, set, offerId: OfferId | null) => {
    set(focusedOfferIdAtom, offerId)
    if (offerId) {
      set(refocusMapActionAtom, {focusAllOffers: false})
    }
  }
)
