import {type OfferId} from '@vexl-next/domain/src/general/offers'
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

export const focusedOfferIsOfflineAtom = atom((get) => {
  return get(focusedOfferAtom)?.offerInfo.publicPart.location.length === 0
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
      set(
        animateToCoordinateActionAtom,
        getOfferLocationBorderPoints(locationFilter)
      )
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
