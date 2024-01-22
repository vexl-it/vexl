import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {atom} from 'jotai'
import type MapView from 'react-native-maps'
import {type LatLng, type Region} from 'react-native-maps'
import getOfferLocationBorderPoints from '../../utils/getOfferLocationBorderPoints'

export const mapLayoutVisibleAtom = atom<boolean>(false)
export const toggleMapLayoutVisibleActionAtom = atom(
  (get) => get(mapLayoutVisibleAtom),
  (_, set) => {
    set(mapLayoutVisibleAtom, (prev) => !prev)
  }
)

export const mapViewRefAtom = atom<MapView | undefined>(undefined)
export const animateToRegionActionAtom = atom(
  null,
  (get, set, region: Region) => {
    const ref = get(mapViewRefAtom)
    ref?.animateToRegion(region)
  }
)

export const animateToCoordinateActionAtom = atom(
  null,
  (get, set, coordinates: LatLng[]) => {
    get(mapViewRefAtom)?.fitToCoordinates(coordinates)
  }
)

export const animateToOfferActionAtom = atom(
  null,
  (get, set, offer: OneOfferInState) => {
    if (offer.offerInfo.publicPart.location.length === 0) return

    const borderPoints = offer.offerInfo.publicPart.location.flatMap(
      getOfferLocationBorderPoints
    )
    get(mapViewRefAtom)?.fitToCoordinates(borderPoints)
  }
)
