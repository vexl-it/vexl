import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {
  type EdgePadding,
  type LatLng,
  type MapCameraControls,
  type Region,
} from '../../../../components/Map/types'
import {
  coordinatesToBounds,
  regionToBounds,
} from '../../../../components/Map/utils/mapLibreRegion'
import {filterLocationsByCircularLocationFilter} from '../../utils/circularLocationFilter'
import getOfferLocationBorderPoints from '../../utils/getOfferLocationBorderPoints'
import {locationFilterAtom} from '../filterAtoms'
import {requestMapRegionCommitAfterCameraMoveActionAtom} from '../mapRegionAtom'

const DEFAULT_FIT_EDGE_PADDING: EdgePadding = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
}

const mapCameraControlsAtom = atom<MapCameraControls | undefined>(undefined)
export const setMapCameraControlsAtom = atom(
  null,
  (_, set, v: MapCameraControls | undefined) => {
    set(mapCameraControlsAtom, v)
  }
)
export const animateToRegionActionAtom = atom(
  null,
  (get, set, region: Region) => {
    const camera = get(mapCameraControlsAtom)
    if (!camera) return

    set(requestMapRegionCommitAfterCameraMoveActionAtom)
    camera.fitBounds(regionToBounds(region))
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
    const camera = get(mapCameraControlsAtom)
    if (!camera) return
    if (!Array.isNonEmptyReadonlyArray(coordinates)) return

    set(requestMapRegionCommitAfterCameraMoveActionAtom)
    camera.fitBounds(coordinatesToBounds(coordinates), {
      padding: edgePadding ?? DEFAULT_FIT_EDGE_PADDING,
    })
  }
)

export const animateToOfferActionAtom = atom(
  null,
  (get, set, offer: OneOfferInState) => {
    const borderPoints = pipe(
      filterLocationsByCircularLocationFilter({
        locations: offer.offerInfo.publicPart.location,
        locationFilter: get(locationFilterAtom),
      }),
      Array.flatMap(getOfferLocationBorderPoints)
    )

    set(fitToCoordinatesActionAtom, {coordinates: borderPoints})
  }
)
