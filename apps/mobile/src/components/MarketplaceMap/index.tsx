import {useNavigation} from '@react-navigation/native'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {Dimensions} from 'react-native'
import {type Details, type Region} from 'react-native-maps'
import {Stack} from 'tamagui'
import {
  focusedOfferIdAtom,
  refocusMapActionAtom,
} from '../../state/marketplace/atoms/map/focusedOffer'
import {setMapViewRefAtom} from '../../state/marketplace/atoms/map/mapViewAtoms'
import {mapRegionAtom} from '../../state/marketplace/atoms/mapRegionAtom'
import MapDisplayMultiplePoints from '../Map/components/MapDisplayMultiplePoints'
import {focusedPointsIdsAtom, mapPointsAtom} from './atoms'

export const MAP_SIZE = Math.min(Dimensions.get('window').height / 3.25, 400)

function MarketplaceMapSizeContainer({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return <Stack h={MAP_SIZE}>{children}</Stack>
}

export default function MarketplaceMap(): JSX.Element {
  const navigation = useNavigation()
  const store = useStore()
  const setSelectedRegion = useSetAtom(mapRegionAtom)
  const refocusMap = useSetAtom(refocusMapActionAtom)

  const onRegionSelected = useCallback(
    (region: Region, details: Details): void => {
      if (!details.isGesture) return
      if (!store.get(focusedOfferIdAtom)) {
        // If offer is focused do not set region
        setSelectedRegion(region)
      }
    },
    [store, setSelectedRegion]
  )

  const onPointPress = useCallback(
    (one: {data: OneOfferInState}) => {
      navigation.navigate('OfferDetail', {
        offerId: one.data.offerInfo.offerId,
      })
    },
    [navigation]
  )

  const onMapReady = useCallback(() => {
    refocusMap({focusAllOffers: false})
  }, [refocusMap])

  return (
    <MarketplaceMapSizeContainer>
      <MapDisplayMultiplePoints
        mapPadding={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onMapReady={onMapReady}
        pointsAtom={mapPointsAtom}
        onRegionChangeComplete={onRegionSelected}
        pointIdsToFocusAtom={focusedPointsIdsAtom}
        refAtom={setMapViewRefAtom}
        onPointPress={onPointPress}
      />
    </MarketplaceMapSizeContainer>
  )
}
