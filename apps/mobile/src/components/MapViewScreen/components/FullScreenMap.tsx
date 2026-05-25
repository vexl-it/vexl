import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Stack} from '@vexl-next/ui/src/primitives'
import {useSetAtom, useStore} from 'jotai'
import React, {useCallback, useRef} from 'react'
import {
  type Details,
  type EdgePadding,
  type LatLng,
  type Region,
} from 'react-native-maps'
import {focusedOfferIdAtom} from '../../../state/marketplace/atoms/map/focusedOffer'
import {
  animateToRegionActionAtom,
  fitToCoordinatesActionAtom,
  setMapViewRefAtom,
} from '../../../state/marketplace/atoms/map/mapViewAtoms'
import {
  commitMapRegionAfterCameraMoveActionAtom,
  mapRegionAtom,
} from '../../../state/marketplace/atoms/mapRegionAtom'
import MapDisplayMultiplePoints from '../../Map/components/MapDisplayMultiplePoints'
import {
  fitMapViewToAllPinsActionAtom,
  focusedPointsIdsAtom,
  mapPointsAtom,
  selectMapViewOfferActionAtom,
} from '../atoms'

interface Props {
  readonly fitEdgePadding: EdgePadding
  readonly onMapReady?: () => void
}

const DEFOCUS_ZOOM_OUT_MULTIPLIER = 2
const MAX_DEFOCUS_LATITUDE_DELTA = 80
const MAX_DEFOCUS_LONGITUDE_DELTA = 180

function getZoomedOutRegion(region: Region): Region {
  return {
    ...region,
    latitudeDelta: Math.min(
      region.latitudeDelta * DEFOCUS_ZOOM_OUT_MULTIPLIER,
      MAX_DEFOCUS_LATITUDE_DELTA
    ),
    longitudeDelta: Math.min(
      region.longitudeDelta * DEFOCUS_ZOOM_OUT_MULTIPLIER,
      MAX_DEFOCUS_LONGITUDE_DELTA
    ),
  }
}

function FullScreenMap({
  fitEdgePadding,
  onMapReady: onMapReadyProp,
}: Props): React.JSX.Element {
  const store = useStore()
  const latestRegionRef = useRef<Region | null>(null)
  const currentCameraMoveStartedAsGestureRef = useRef(false)
  const setSelectedRegion = useSetAtom(mapRegionAtom)
  const commitMapRegionAfterCameraMove = useSetAtom(
    commitMapRegionAfterCameraMoveActionAtom
  )
  const fitMapToAllPins = useSetAtom(fitMapViewToAllPinsActionAtom)
  const animateToRegion = useSetAtom(animateToRegionActionAtom)
  const fitToCoordinates = useSetAtom(fitToCoordinatesActionAtom)
  const selectOffer = useSetAtom(selectMapViewOfferActionAtom)

  const handleRegionChangeStart = useCallback(
    (_region: Region, details: Details): void => {
      currentCameraMoveStartedAsGestureRef.current = details.isGesture === true
    },
    []
  )

  const handleRegionChangeComplete = useCallback(
    (region: Region): void => {
      latestRegionRef.current = region
      const focusedOfferId = store.get(focusedOfferIdAtom)
      const wasGesture = currentCameraMoveStartedAsGestureRef.current
      currentCameraMoveStartedAsGestureRef.current = false

      if (wasGesture) {
        if (!focusedOfferId) {
          setSelectedRegion(region)
        }
        return
      }

      commitMapRegionAfterCameraMove({
        region,
        shouldCommit: !focusedOfferId,
      })
    },
    [commitMapRegionAfterCameraMove, store, setSelectedRegion]
  )

  const handleClusterPress = useCallback(
    (coordinates: readonly LatLng[]) => {
      selectOffer(null)

      if (coordinates.length === 0) return

      fitToCoordinates({
        coordinates,
        edgePadding: fitEdgePadding,
      })
    },
    [fitEdgePadding, fitToCoordinates, selectOffer]
  )

  const onMapReady = useCallback(() => {
    fitMapToAllPins(fitEdgePadding)
    onMapReadyProp?.()
  }, [fitEdgePadding, fitMapToAllPins, onMapReadyProp])

  const handlePointPress = useCallback(
    (point: {data: OneOfferInState}) => {
      const offerId = point.data.offerInfo.offerId

      if (store.get(focusedOfferIdAtom) === offerId) {
        selectOffer(offerId)

        const latestRegion = latestRegionRef.current
        if (latestRegion) {
          animateToRegion(getZoomedOutRegion(latestRegion))
        }

        return
      }

      selectOffer(offerId)
    },
    [animateToRegion, selectOffer, store]
  )

  return (
    <Stack flex={1}>
      <MapDisplayMultiplePoints
        mapPadding={{top: 0, left: 0, right: 0, bottom: 0}}
        onMapReady={onMapReady}
        pointsAtom={mapPointsAtom}
        onRegionChangeStart={handleRegionChangeStart}
        onRegionChangeComplete={handleRegionChangeComplete}
        onClusterPress={handleClusterPress}
        pointIdsToFocusAtom={focusedPointsIdsAtom}
        refAtom={setMapViewRefAtom}
        onPointPress={handlePointPress}
        showAllPointsInFocusMode
      />
    </Stack>
  )
}

export default FullScreenMap
