import {useNavigation, useNavigationState} from '@react-navigation/native'
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
import {CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING} from '../InsideRouter/components/ContainerWithTopBorderRadius'
import MapDisplayMultiplePoints from '../Map/components/MapDisplayMultiplePoints'
import {focusedPointsIdsAtom, mapPointsAtom} from './atoms'

function MarketplaceMapSizeContainer({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const isOnOfferDetail = useNavigationState(
    useCallback((navigationState): boolean => {
      const currentRoute = navigationState?.routes[navigationState?.index]

      if (currentRoute?.name === 'OfferDetail') {
        return true
      }

      return false
    }, [])
  )

  return (
    <Stack
      w="100%"
      backgroundColor="black"
      h={Math.min(
        Dimensions.get('window').height / (isOnOfferDetail ? 3.25 : 2),
        400
      )}
      marginBottom={-CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING}
    >
      {children}
    </Stack>
  )
}

export default function MarketplaceMap({
  marginTop,
}: {
  marginTop: number
}): JSX.Element {
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
          top: marginTop,
          left: 0,
          right: 0,
          bottom: CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING,
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
