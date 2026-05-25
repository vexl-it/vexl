import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import type MapView from 'react-native-map-clustering'
import {type EdgePadding, type LatLng, type Region} from 'react-native-maps'
import {filterLocationsByCircularLocationFilter} from '../../utils/circularLocationFilter'
import getOfferLocationBorderPoints from '../../utils/getOfferLocationBorderPoints'
import {locationFilterAtom} from '../filterAtoms'
import {requestMapRegionCommitAfterCameraMoveActionAtom} from '../mapRegionAtom'

const mapViewRefAtom = atom<MapView | undefined>(undefined)
export const setMapViewRefAtom = atom(
  null,
  (_, set, v: MapView | undefined) => {
    set(mapViewRefAtom, v)
  }
)
export const animateToRegionActionAtom = atom(
  null,
  (get, set, region: Region) => {
    const ref = get(mapViewRefAtom)
    if (!ref) return

    set(requestMapRegionCommitAfterCameraMoveActionAtom)
    // @ts-expect-error bad typing of react-native-map-clustering
    ref.animateToRegion(region)
  }
)

export const animateToCoordinateActionAtom = atom(
  null,
  (get, set, coordinates: readonly LatLng[]) => {
    const ref = get(mapViewRefAtom)
    if (!ref) return

    set(requestMapRegionCommitAfterCameraMoveActionAtom)
    // @ts-expect-error bad typing of react-native-map-clustering
    ref.fitToCoordinates(coordinates)
  }
)

export const fitToCoordinatesActionAtom = atom(
  null,
  (
    get,
    set,
    {
      coordinates,
      edgePadding,
    }: {
      coordinates: readonly LatLng[]
      edgePadding?: EdgePadding
    }
  ) => {
    const ref = get(mapViewRefAtom)
    if (!ref) return

    set(requestMapRegionCommitAfterCameraMoveActionAtom)
    // @ts-expect-error bad typing of react-native-map-clustering
    ref.fitToCoordinates(coordinates, {
      animated: true,
      edgePadding,
    })
  }
)

export const animateToOfferActionAtom = atom(
  null,
  (get, set, offer: OneOfferInState) => {
    if (offer.offerInfo.publicPart.location.length === 0) return

    const borderPoints = pipe(
      filterLocationsByCircularLocationFilter({
        locations: offer.offerInfo.publicPart.location,
        locationFilter: get(locationFilterAtom),
      }),
      Array.flatMap(getOfferLocationBorderPoints)
    )
    if (!Array.isNonEmptyReadonlyArray(borderPoints)) return

    const ref = get(mapViewRefAtom)
    if (!ref) return

    set(requestMapRegionCommitAfterCameraMoveActionAtom)
    // @ts-expect-error bad typing of react-native-map-clustering
    ref.fitToCoordinates(borderPoints)
  }
)
