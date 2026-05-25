import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {type EdgePadding} from 'react-native-maps'
import {locationFilterAtom} from '../../state/marketplace/atoms/filterAtoms'
import {filteredOffersForMapAtom} from '../../state/marketplace/atoms/filteredOffers'
import {
  focusedOfferAtom,
  focusedOfferIdAtom,
  refocusMapActionAtom,
} from '../../state/marketplace/atoms/map/focusedOffer'
import {
  animateToRegionActionAtom,
  fitToCoordinatesActionAtom,
} from '../../state/marketplace/atoms/map/mapViewAtoms'
import {mapRegionAtom} from '../../state/marketplace/atoms/mapRegionAtom'
import europeRegion from '../Map/utils/europeRegion'
import {createMapPointsForOffers} from './mapPoints'

export {
  createMapPointsForOffers,
  offerHasVisibleMapLocation,
  type OfferWithMapLocations,
} from './mapPoints'

export const mapViewSelectedOfferIdAtom = focusedOfferIdAtom
export const mapViewSelectedOfferAtom = focusedOfferAtom

export const mapPointsAtom = atom((get) => {
  const offers = get(filteredOffersForMapAtom)
  const locationFilter = get(locationFilterAtom)

  return createMapPointsForOffers({
    offers,
    locationFilter,
  })
})

export const focusedPointsIdsAtom = atom((get) => {
  const focusedOfferId = get(focusedOfferIdAtom)
  if (!focusedOfferId) return undefined

  return pipe(
    get(mapPointsAtom),
    Array.filter((point) => point.data.offerInfo.offerId === focusedOfferId),
    Array.map((point) => point.id)
  )
})

export const selectMapViewOfferActionAtom = atom(
  null,
  (get, set, offerId: OfferId | null) => {
    const current = get(focusedOfferIdAtom)
    if (current === offerId) {
      set(focusedOfferIdAtom, null)
      return
    }
    set(focusedOfferIdAtom, offerId)
    if (offerId) {
      set(refocusMapActionAtom, {focusAllOffers: false})
    }
  }
)

export const clearMapViewSelectionActionAtom = atom(null, (get, set) => {
  set(focusedOfferIdAtom, null)
})

export const fitMapViewToAllPinsActionAtom = atom(
  null,
  (get, set, edgePadding?: EdgePadding) => {
    set(focusedOfferIdAtom, null)
    set(mapRegionAtom, null)

    const coordinates = pipe(
      get(mapPointsAtom),
      Array.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      }))
    )

    if (coordinates.length === 0) {
      set(animateToRegionActionAtom, europeRegion)
      return
    }

    set(fitToCoordinatesActionAtom, {coordinates, edgePadding})
  }
)
