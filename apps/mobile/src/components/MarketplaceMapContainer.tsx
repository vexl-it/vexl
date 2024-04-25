import {useNavigationState} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import {memo, useCallback} from 'react'
import {Stack, YStack} from 'tamagui'
import {locationFilterAtom} from '../state/marketplace/atoms/filterAtoms'
import {clearRegionAndRefocusActionAtom} from '../state/marketplace/atoms/map/focusedOffer'
import marketplaceLayoutModeAtom from '../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import {isMapRegionSetAtom} from '../state/marketplace/atoms/mapRegionAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import Button from './Button'
import MarketplaceMap from './MarketplaceMap'

// function useNavigationFromMap(): 'OfferDetail' | 'Marketplace' | 'others' {
//   return useNavigationState(
//     useCallback((navigationState): 'OfferDetail' | 'Marketplace' | 'others' => {
//       const currentRoute = navigationState?.routes[navigationState?.index]
//
//       if (!currentRoute) return 'Marketplace' // Default route is marketplace
//
//       if (currentRoute?.name === 'OfferDetail') {
//         return 'OfferDetail'
//       }
//
//       if (currentRoute?.name === 'InsideTabs') {
//         const insideTabsRoute =
//           currentRoute.state?.routes[currentRoute.state?.index ?? -1]
//
//         if (!insideTabsRoute || insideTabsRoute?.name === 'Marketplace') {
//           return 'Marketplace'
//         }
//       }
//       return 'others'
//     }, [])
//   )
// }

// function useShouldShowMap(): boolean {
//   const navigationRoute = useNavigationFromMap()
//   const marketplaceLayoutMode = useAtomValue(marketplaceLayoutModeAtom)
//   const focusedOfferIsOffline = useAtomValue(focusedOfferIsOfflineAtom)
//   const keyboardShown = useIsKeyboardShown()
//
//   return (
//     (navigationRoute === 'Marketplace' && marketplaceLayoutMode === 'map') ||
//     (!keyboardShown &&
//       navigationRoute === 'OfferDetail' &&
//       !focusedOfferIsOffline)
//   )
// }

// function useShouldShowMapBarAndButton(): boolean {
//   const mapNavigationRoute = useNavigationFromMap()
//   return mapNavigationRoute === 'Marketplace'
// }

function useIsCurrentRouteOfferDetail(): boolean {
  return useNavigationState(
    useCallback((navigationState) => {
      const currentRoute = navigationState?.routes[navigationState?.index]
      return currentRoute?.name === 'OfferDetail'
    }, [])
  )
}

function MapBarAndButton(): JSX.Element | null {
  const {t} = useTranslation()
  // const shouldShowMapBarAndButton = useShouldShowMapBarAndButton()
  const isMapRegionSet = useAtomValue(isMapRegionSetAtom)
  const isCurrentRouteOfferDetail = useIsCurrentRouteOfferDetail()
  const clearAndRefocus = useSetAtom(clearRegionAndRefocusActionAtom)
  const locationFilter = useAtomValue(locationFilterAtom)

  // const setMapRegion = useSetAtom(mapRegionAtom)
  // const animateToRegion = useSetAtom(animateToRegionActionAtom)
  //
  // const [locationSessionId, setLocationSessionId] =
  //   useState<LocationSessionId | null>(null)

  // const onSelectLocationSearch = useCallback(
  //   (v: LocationSuggestion) => {
  //     setLocationSessionId(null)
  //     const region = {
  //       latitude: v.userData.latitude,
  //       longitude: v.userData.longitude,
  //       latitudeDelta:
  //         v.userData.viewport.northeast.latitude -
  //         v.userData.viewport.southwest.latitude,
  //       longitudeDelta:
  //         v.userData.viewport.northeast.longitude -
  //         v.userData.viewport.southwest.longitude,
  //     }
  //
  //     setMapRegion(region)
  //     animateToRegion(region)
  //   },
  //   [animateToRegion, setMapRegion]
  // )

  if (isCurrentRouteOfferDetail) return null

  return (
    <>
      <YStack position="absolute" top={20} als="center">
        {!!isMapRegionSet && (
          <Button
            variant="primary"
            size="small"
            onPress={clearAndRefocus}
            text={
              locationFilter
                ? t('map.resetTo', {name: locationFilter.address})
                : t('map.reset')
            }
          />
        )}
      </YStack>
      {/* <Modal */}
      {/*  animationType="fade" */}
      {/*  onRequestClose={() => { */}
      {/*    setLocationSessionId(null) */}
      {/*  }} */}
      {/*  visible={!!locationSessionId} */}
      {/* > */}
      {/*  {!!locationSessionId && ( */}
      {/*    <Screen customHorizontalPadding={16}> */}
      {/*      <ScreenTitle text=""> */}
      {/*        <IconButton */}
      {/*          variant="dark" */}
      {/*          icon={closeSvg} */}
      {/*          onPress={() => { */}
      {/*            setLocationSessionId(null) */}
      {/*          }} */}
      {/*        /> */}
      {/*      </ScreenTitle> */}
      {/*      <LocationSearch */}
      {/*        onPress={onSelectLocationSearch} */}
      {/*        sessionId={locationSessionId} */}
      {/*      ></LocationSearch> */}
      {/*    </Screen> */}
      {/*  )} */}
      {/* </Modal> */}
    </>
  )
}

const MapBarAndButtonMemoized = memo(MapBarAndButton)
const MarketplaceMapMemoized = memo(MarketplaceMap)

function MarketplaceMapContainer(): JSX.Element | null {
  const marketplaceLayoutMode = useAtomValue(marketplaceLayoutModeAtom)
  const shouldShowMap =
    useIsCurrentRouteOfferDetail() || marketplaceLayoutMode === 'map'

  if (shouldShowMap) {
    return (
      <Stack position="relative" pt="$2">
        <MarketplaceMapMemoized />
        <MapBarAndButtonMemoized />
      </Stack>
    )
  }

  return null
}

export default MarketplaceMapContainer
