import {useNavigationState} from '@react-navigation/native'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {useAtomValue, useSetAtom} from 'jotai'
import {memo, useCallback, useState} from 'react'
import {Modal} from 'react-native'
import {TouchableWithoutFeedback} from 'react-native-gesture-handler'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
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
import Button from '../../Button'
import IconButton from '../../IconButton'
import Image from '../../Image'
import LocationSearch from '../../LocationSearch'
import {
  newLocationSessionId,
  type LocationSessionId,
} from '../../LocationSearch/molecule'
import MarketplaceMap from '../../MarketplaceMap'
import Screen from '../../Screen'
import ScreenTitle from '../../ScreenTitle'
import closeSvg from '../../images/closeSvg'
import magnifyingGlass from '../../images/magnifyingGlass'

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
  // const keyboardShown = useIsKeyboardShown()

  return (
    (navigationRoute === 'Marketplace' && marketplaceLayoutMode === 'map') ||
    // (!keyboardShown &&
    (navigationRoute === 'OfferDetail' && !focusedOfferIsOffline)
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
      setLocationSessionId(null)
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
        <TouchableWithoutFeedback
          onPress={() => {
            setLocationSessionId(newLocationSessionId())
          }}
        >
          <XStack ai="center" p="$5" bc="$grey" br="$5">
            <Stack h={24} w={24}>
              <Image
                stroke={getTokens().color.white.val}
                source={magnifyingGlass}
              />
            </Stack>
            <Text ml="$4" ff="$body600" fos={18} col="$greyOnBlack">
              {t('filterOffers.searchOffersByLocation')}
            </Text>
          </XStack>
        </TouchableWithoutFeedback>
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
