import {
  type OfferId,
  type OfferLocation,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {type EdgePadding} from 'react-native-maps'
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

export const mapViewSelectedOfferIdAtom = focusedOfferIdAtom
export const mapViewSelectedOfferAtom = focusedOfferAtom

export const mapPointsAtom = atom((get) => {
  const offers = get(filteredOffersForMapAtom)

  return pipe(
    offers,
    Array.flatMap((offer: OneOfferInState) =>
      pipe(
        offer.offerInfo.publicPart.location,
        Array.map((one: OfferLocation) => ({
          data: offer,
          id: `${offer.offerInfo.offerId}-${one.placeId}`,
          latitude: one.latitude,
          longitude: one.longitude,
        }))
      )
    )
  )
})

export const focusedPointsIdsAtom = atom((get) => {
  const focusedOffer = get(focusedOfferAtom)
  if (!focusedOffer) return undefined

  return pipe(
    focusedOffer.offerInfo.publicPart.location,
    Array.map((one) => `${focusedOffer.offerInfo.offerId}-${one.placeId}`)
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

export const mapViewLoadingRequestAtom = atom(0)

export const requestMapViewLoadingActionAtom = atom(null, (get, set) => {
  set(mapViewLoadingRequestAtom, get(mapViewLoadingRequestAtom) + 1)
})

export const fitMapViewToAllPinsActionAtom = atom(
  null,
  (get, set, edgePadding?: EdgePadding) => {
    set(focusedOfferIdAtom, null)
    set(mapRegionAtom, null)

    const coordinates = pipe(
      get(filteredOffersForMapAtom),
      Array.flatMap((offer) =>
        pipe(
          offer.offerInfo.publicPart.location,
          Array.map((location) => ({
            latitude: location.latitude,
            longitude: location.longitude,
          }))
        )
      )
    )

    if (coordinates.length === 0) {
      set(animateToRegionActionAtom, europeRegion)
      return
    }

    set(fitToCoordinatesActionAtom, {coordinates, edgePadding})
  }
)
