import {useNavigationState} from '@react-navigation/native'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {useAtomValue, useSetAtom} from 'jotai'
import {memo, useCallback, useState} from 'react'
import {Modal} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, XStack, YStack} from 'tamagui'
import {locationFilterAtom} from '../../../state/marketplace/atoms/filterAtoms'
import {
  clearRegionAndRefocusActionAtom,
  focusedOfferIsOfflineAtom,
} from '../../../state/marketplace/atoms/map/focusedOffer'
import {animateToRegionActionAtom} from '../../../state/marketplace/atoms/map/mapViewAtoms'
import marketplaceLayoutModeAtom from '../../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import {
  isMapRegionSetAtom,
  mapRegionAtom,
} from '../../../state/marketplace/atoms/mapRegionAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useIsKeyboardShown from '../../../utils/useIsKeyboardShown'
import Button from '../../Button'
import IconButton from '../../IconButton'
import BaseFilterDropdown from '../../InsideRouter/components/MarketplaceScreen/components/BaseFilterDropdown'
import FilterButton from '../../InsideRouter/components/MarketplaceScreen/components/FilterButton'
import SearchOffers from '../../InsideRouter/components/MarketplaceScreen/components/SearchOffers'
import LocationSearch from '../../LocationSearch'
import {type LocationSessionId} from '../../LocationSearch/molecule'
import MarketplaceMap from '../../MarketplaceMap'
import Screen from '../../Screen'
import ScreenTitle from '../../ScreenTitle'
import closeSvg from '../../images/closeSvg'

function useNavigationFromMap(): 'OfferDetail' | 'Marketplace' | 'others' {
  return useNavigationState(
    useCallback((navigationState): 'OfferDetail' | 'Marketplace' | 'others' => {
      const currentRoute = navigationState?.routes[navigationState?.index]

      if (!currentRoute) return 'Marketplace' // Default route is marketplace

      if (currentRoute?.name === 'OfferDetail') {
        return 'OfferDetail'
      }

      if (currentRoute?.name === 'InsideTabs') {
        const insideTabsRoute =
          currentRoute.state?.routes[currentRoute.state?.index ?? -1]

        if (!insideTabsRoute || insideTabsRoute?.name === 'Marketplace') {
          return 'Marketplace'
        }
      }
      return 'others'
    }, [])
  )
}

function useShouldShowMap(): boolean {
  const navigationRoute = useNavigationFromMap()
  const marketplaceLayoutMode = useAtomValue(marketplaceLayoutModeAtom)
  const focusedOfferIsOffline = useAtomValue(focusedOfferIsOfflineAtom)
  const keyboardShown = useIsKeyboardShown()

  return (
    (navigationRoute === 'Marketplace' && marketplaceLayoutMode === 'map') ||
    (!keyboardShown &&
      navigationRoute === 'OfferDetail' &&
      !focusedOfferIsOffline)
  )
}

function useShouldShowMapBarAndButton(): boolean {
  const mapNavigationRoute = useNavigationFromMap()
  return mapNavigationRoute === 'Marketplace'
}

function MapBarAndButton(): JSX.Element | null {
  const {t} = useTranslation()
  const shouldShowMapBarAndButton = useShouldShowMapBarAndButton()
  const isMapRegionSet = useAtomValue(isMapRegionSetAtom)
  const clearAndRefocus = useSetAtom(clearRegionAndRefocusActionAtom)
  const insets = useSafeAreaInsets()
  const locationFilter = useAtomValue(locationFilterAtom)

  const setMapRegion = useSetAtom(mapRegionAtom)
  const animateToRegion = useSetAtom(animateToRegionActionAtom)

  const [locationSessionId, setLocationSessionId] =
    useState<LocationSessionId | null>(null)

  const onSelectLocationSearch = useCallback(
    (v: LocationSuggestion) => {
      // setLocationSessionId(null)
      const region = {
        latitude: v.userData.latitude,
        longitude: v.userData.longitude,
        latitudeDelta:
          v.userData.viewport.northeast.latitude -
          v.userData.viewport.southwest.latitude,
        longitudeDelta:
          v.userData.viewport.northeast.longitude -
          v.userData.viewport.southwest.longitude,
      }

      setMapRegion(region)
      animateToRegion(region)
    },
    [animateToRegion, setMapRegion]
  )

  if (!shouldShowMapBarAndButton) return null

  return (
    <>
      <YStack
        f={1}
        position="absolute"
        gap="$2"
        top={insets.top}
        left="$3"
        right="$3"
      >
        <Stack space="$2">
          <BaseFilterDropdown postSelectActions={clearAndRefocus} />
          <XStack space="$2">
            <SearchOffers postSearchActions={clearAndRefocus} />
            <FilterButton />
          </XStack>
        </Stack>
        {!!isMapRegionSet && (
          <YStack alignItems="center">
            <Button
              variant="primary"
              size="small"
              onPress={clearAndRefocus}
              text={
                locationFilter
                  ? t('map.resetTo', {name: locationFilter.address})
                  : t('map.reset')
              }
            ></Button>
          </YStack>
        )}
      </YStack>
      <Modal
        animationType="fade"
        onRequestClose={() => {
          setLocationSessionId(null)
        }}
        visible={!!locationSessionId}
      >
        {!!locationSessionId && (
          <Screen customHorizontalPadding={16}>
            <ScreenTitle text="">
              <IconButton
                variant="dark"
                icon={closeSvg}
                onPress={() => {
                  setLocationSessionId(null)
                }}
              />
            </ScreenTitle>
            <LocationSearch
              onPress={onSelectLocationSearch}
              sessionId={locationSessionId}
            ></LocationSearch>
          </Screen>
        )}
      </Modal>
    </>
  )
}

const MapBarAndButtonMemoized = memo(MapBarAndButton)
const MarketplaceMapMemoized = memo(MarketplaceMap)

function MarketplaceMapContainer(): JSX.Element | null {
  const shouldShowMap = useShouldShowMap()

  if (shouldShowMap) {
    return (
      <>
        <Stack position="relative">
          <MarketplaceMapMemoized marginTop={100} />
          <MapBarAndButtonMemoized />
        </Stack>
      </>
    )
  }

  return null
}

export default MarketplaceMapContainer
