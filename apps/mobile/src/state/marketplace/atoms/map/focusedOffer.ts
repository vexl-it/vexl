import {
  type OfferId,
  type OfferLocation,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type LatLong} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, pipe} from 'effect'
import {atom, type Getter} from 'jotai'
import europeRegion from '../../../../components/Map/utils/europeRegion'
import {filterLocationsByCircularLocationFilter} from '../../utils/circularLocationFilter'
import getOfferLocationBorderPoints from '../../utils/getOfferLocationBorderPoints'
import {locationFilterAtom, resetLocationFilterActionAtom} from '../filterAtoms'
import {filteredOffersForMapAtom} from '../filteredOffers'
import {mapRegionAtom} from '../mapRegionAtom'
import {offersAtom} from '../offersState'
import {
  animateToOfferActionAtom,
  animateToRegionActionAtom,
  fitToCoordinatesActionAtom,
} from './mapViewAtoms'

export const focusedOfferIdAtom = atom<OfferId | null>(null)
export const focusedOfferAtom = atom((get) => {
  const id = get(focusedOfferIdAtom)
  return get(offersAtom).find((one) => one.offerInfo.offerId === id)
})

function getFilteredOffersBorderPoints(get: Getter): readonly LatLong[] {
  const locationFilter = get(locationFilterAtom)

  return pipe(
    get(filteredOffersForMapAtom),
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
}

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
      const borderPoints = getFilteredOffersBorderPoints(get)
      if (Array.isNonEmptyReadonlyArray(borderPoints)) {
        set(fitToCoordinatesActionAtom, {coordinates: borderPoints})
        return
      }
    }

    const mapRegion = get(mapRegionAtom)
    if (mapRegion) {
      set(animateToRegionActionAtom, mapRegion)
      return
    }

    const locationFilter = get(locationFilterAtom)
    if (locationFilter && Array.isNonEmptyReadonlyArray(locationFilter)) {
      const oneLocation: OfferLocation | undefined = locationFilter[0]

      if (locationFilter.length === 1 && oneLocation) {
        // this should avoid zooming too much on filtered location if there is only one
        set(fitToCoordinatesActionAtom, {
          coordinates: getOfferLocationBorderPoints(oneLocation),
        })
        return
      }

      set(fitToCoordinatesActionAtom, {
        coordinates: pipe(
          locationFilter,
          Array.map((one) => ({
            latitude: one.latitude,
            longitude: one.longitude,
          }))
        ),
      })
      return
    }

    const borderPoints = getFilteredOffersBorderPoints(get)
    if (Array.isNonEmptyReadonlyArray(borderPoints)) {
      set(fitToCoordinatesActionAtom, {coordinates: borderPoints})
      return
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
