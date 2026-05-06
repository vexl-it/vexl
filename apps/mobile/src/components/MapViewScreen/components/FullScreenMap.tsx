import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Stack} from '@vexl-next/ui/src/primitives'
import {useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {type Details, type EdgePadding, type Region} from 'react-native-maps'
import {focusedOfferIdAtom} from '../../../state/marketplace/atoms/map/focusedOffer'
import {setMapViewRefAtom} from '../../../state/marketplace/atoms/map/mapViewAtoms'
import {mapRegionAtom} from '../../../state/marketplace/atoms/mapRegionAtom'
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

function FullScreenMap({
  fitEdgePadding,
  onMapReady: onMapReadyProp,
}: Props): React.JSX.Element {
  const store = useStore()
  const setSelectedRegion = useSetAtom(mapRegionAtom)
  const fitMapToAllPins = useSetAtom(fitMapViewToAllPinsActionAtom)
  const selectOffer = useSetAtom(selectMapViewOfferActionAtom)

  const onRegionSelected = useCallback(
    (region: Region, details: Details): void => {
      if (!details.isGesture) return
      if (!store.get(focusedOfferIdAtom)) {
        setSelectedRegion(region)
      }
    },
    [store, setSelectedRegion]
  )

  const onMapReady = useCallback(() => {
    fitMapToAllPins(fitEdgePadding)
    onMapReadyProp?.()
  }, [fitEdgePadding, fitMapToAllPins, onMapReadyProp])

  const handlePointPress = useCallback(
    (point: {data: OneOfferInState}) => {
      const offerId = point.data.offerInfo.offerId

      if (store.get(focusedOfferIdAtom) === offerId) {
        fitMapToAllPins(fitEdgePadding)
        return
      }

      selectOffer(offerId)
    },
    [fitEdgePadding, fitMapToAllPins, selectOffer, store]
  )

  return (
    <Stack flex={1}>
      <MapDisplayMultiplePoints
        mapPadding={{top: 0, left: 0, right: 0, bottom: 0}}
        onMapReady={onMapReady}
        pointsAtom={mapPointsAtom}
        onRegionChangeComplete={onRegionSelected}
        pointIdsToFocusAtom={focusedPointsIdsAtom}
        refAtom={setMapViewRefAtom}
        onPointPress={handlePointPress}
        showAllPointsInFocusMode
      />
    </Stack>
  )
}

export default FullScreenMap
