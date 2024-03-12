import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {atom} from 'jotai'
import type MapView from 'react-native-map-clustering'
import {type LatLng, type Region} from 'react-native-maps'
import getOfferLocationBorderPoints from '../../utils/getOfferLocationBorderPoints'

export const mapLayoutVisibleAtom = atom<boolean>(false)
export const toggleMapLayoutVisibleActionAtom = atom(
  (get) => get(mapLayoutVisibleAtom),
  (_, set) => {
    set(mapLayoutVisibleAtom, (prev) => !prev)
  }
)

const mapViewRefAtom = atom<MapView | undefined>(undefined)
export const setMapViewRefAtom = atom(null, (_, set, v: MapView) => {
  set(mapViewRefAtom, v)
})
export const animateToRegionActionAtom = atom(
  null,
  (get, set, region: Region) => {
    const ref = get(mapViewRefAtom)
    // @ts-expect-error bad typing of react-native-map-clustering
    ref?.animateToRegion(region)
  }
)

export const animateToCoordinateActionAtom = atom(
  null,
  (get, set, coordinates: LatLng[]) => {
    // @ts-expect-error bad typing of react-native-map-clustering
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
    // @ts-expect-error bad typing of react-native-map-clustering
    get(mapViewRefAtom)?.fitToCoordinates(borderPoints)
  }
)
