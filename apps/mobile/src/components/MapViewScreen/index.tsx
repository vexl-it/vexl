import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {
  Loader,
  NavigationBar,
  Typography,
  type NavigationBarAction,
} from '@vexl-next/ui'
import {ChevronLeft, TuneSettings} from '@vexl-next/ui/src/icons'
import {Stack, YStack} from '@vexl-next/ui/src/primitives'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Dimensions, StyleSheet, type LayoutChangeEvent} from 'react-native'
import {type EdgePadding} from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens} from 'tamagui'
import {isFilterActiveAtom} from '../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import FilterTagBar from '../InsideRouter/components/MarketplaceScreen/components/FilterTagBar'
import {
  clearMapViewSelectionActionAtom,
  fitMapViewToAllPinsActionAtom,
  mapViewSelectedOfferAtom,
  mapViewSelectedOfferIdAtom,
} from './atoms'
import FullScreenMap from './components/FullScreenMap'
import MapBottomSheet, {
  MAP_BOTTOM_SHEET_MIDDLE_VISIBLE_HEIGHT_RATIO,
} from './components/MapBottomSheet'
import SelectedOfferCard from './components/SelectedOfferCard'

const MAP_LOADING_OVERLAY_DURATION_MS = 850
const MAP_CONTENT_MOUNT_DELAY_MS = 80
const OFFERS_LIST_MOUNT_DELAY_MS = 320
const {height: DEFAULT_SCREEN_HEIGHT} = Dimensions.get('window')
const MAP_FIT_SIDE_PADDING = getTokens().space.$5.val
const MAP_FIT_TOP_PADDING = getTokens().space.$4.val
const MAP_FIT_BOTTOM_GAP = getTokens().space.$4.val

function getMiddleSheetVisibleHeight(screenHeight: number): number {
  return Math.round(screenHeight * MAP_BOTTOM_SHEET_MIDDLE_VISIBLE_HEIGHT_RATIO)
}

function MapLoadingOverlay({
  visible,
}: {
  readonly visible: boolean
}): React.JSX.Element | null {
  const {t} = useTranslation()

  if (!visible) return null

  return (
    <Stack
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      zIndex={100}
      alignItems="center"
      justifyContent="center"
      pointerEvents="auto"
      style={styles.loadingOverlay}
    >
      <Stack
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        backgroundColor="$backgroundPrimary"
        opacity={0.78}
      />
      <YStack
        alignItems="center"
        gap="$3"
        backgroundColor="$backgroundSecondary"
        borderRadius="$5"
        paddingHorizontal="$5"
        paddingVertical="$4"
      >
        <Loader size="medium" />
        <Typography color="$foregroundPrimary" variant="paragraphSmall">
          {t('marketplace.loadingMap')}
        </Typography>
      </YStack>
    </Stack>
  )
}

function MapViewScreen(): React.JSX.Element {
  const {t} = useTranslation()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const store = useStore()
  const safeGoBack = useSafeGoBack()
  const selectedOfferId = useAtomValue(mapViewSelectedOfferIdAtom)
  const selectedOffer = useAtomValue(mapViewSelectedOfferAtom)
  const isFilterActive = useAtomValue(isFilterActiveAtom)
  const fitMapToAllPins = useSetAtom(fitMapViewToAllPinsActionAtom)
  const clearSelection = useSetAtom(clearMapViewSelectionActionAtom)
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [shouldRenderMap, setShouldRenderMap] = useState(false)
  const [shouldRenderOffers, setShouldRenderOffers] = useState(false)
  const [screenHeight, setScreenHeight] = useState(0)
  const [mapHeight, setMapHeight] = useState(0)
  const [mapTopOffset, setMapTopOffset] = useState(0)
  const [bottomSheetVisibleHeight, setBottomSheetVisibleHeight] = useState(() =>
    getMiddleSheetVisibleHeight(DEFAULT_SCREEN_HEIGHT)
  )
  const [bottomSheetRecenterKey, setBottomSheetRecenterKey] = useState(0)
  const mapLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const mapFitEdgePadding: EdgePadding = useMemo(() => {
    return {
      top: MAP_FIT_TOP_PADDING,
      left: MAP_FIT_SIDE_PADDING,
      right: MAP_FIT_SIDE_PADDING,
      bottom: bottomSheetVisibleHeight + insets.bottom + MAP_FIT_BOTTOM_GAP,
    }
  }, [bottomSheetVisibleHeight, insets.bottom])

  const clearMapLoadingTimeout = useCallback(() => {
    if (mapLoadingTimeoutRef.current === null) return

    clearTimeout(mapLoadingTimeoutRef.current)
    mapLoadingTimeoutRef.current = null
  }, [])

  const showMapLoading = useCallback(() => {
    clearMapLoadingTimeout()
    setIsMapLoading(true)
  }, [clearMapLoadingTimeout])

  const hideMapLoadingAfterMarkersSettle = useCallback(() => {
    clearMapLoadingTimeout()
    mapLoadingTimeoutRef.current = setTimeout(() => {
      setIsMapLoading(false)
      mapLoadingTimeoutRef.current = null
    }, MAP_LOADING_OVERLAY_DURATION_MS)
  }, [clearMapLoadingTimeout])

  const refocusMapAfterOfferSetChange = useCallback(() => {
    clearSelection()
    fitMapToAllPins(mapFitEdgePadding)
    hideMapLoadingAfterMarkersSettle()
  }, [
    clearSelection,
    fitMapToAllPins,
    hideMapLoadingAfterMarkersSettle,
    mapFitEdgePadding,
  ])

  const handleSearchChange = useCallback(() => {
    refocusMapAfterOfferSetChange()
  }, [refocusMapAfterOfferSetChange])

  const handleBottomSheetVisibleHeightChange = useCallback(
    ({
      height: nextVisibleHeight,
      recenterMap,
    }: {
      readonly height: number
      readonly recenterMap: boolean
    }) => {
      setBottomSheetVisibleHeight((currentVisibleHeight) =>
        currentVisibleHeight === nextVisibleHeight
          ? currentVisibleHeight
          : nextVisibleHeight
      )
      if (recenterMap) {
        setBottomSheetRecenterKey((currentKey) => currentKey + 1)
      }
    },
    []
  )

  useFocusEffect(
    useCallback(() => {
      if (store.get(mapViewSelectedOfferIdAtom)) return

      showMapLoading()
      hideMapLoadingAfterMarkersSettle()
    }, [hideMapLoadingAfterMarkersSettle, showMapLoading, store])
  )

  const handleRootLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height
    setScreenHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight
    )
  }, [])

  const handleMapAreaLayout = useCallback((event: LayoutChangeEvent) => {
    const nextTopOffset = event.nativeEvent.layout.y
    const nextHeight = event.nativeEvent.layout.height

    setMapTopOffset((currentTopOffset) =>
      currentTopOffset === nextTopOffset ? currentTopOffset : nextTopOffset
    )
    setMapHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight
    )
  }, [])

  const rightActions = useMemo<readonly NavigationBarAction[]>(
    () => [
      {
        icon: TuneSettings,
        variant: isFilterActive ? 'highlighted' : 'normal',
        onPress: () => {
          navigation.navigate('FilterOffers')
        },
      },
    ],
    [isFilterActive, navigation]
  )

  useEffect(() => {
    let offersMountTimeout: ReturnType<typeof setTimeout> | undefined

    const mapMountTimeout = setTimeout(() => {
      setShouldRenderMap(true)
      offersMountTimeout = setTimeout(() => {
        setShouldRenderOffers(true)
      }, OFFERS_LIST_MOUNT_DELAY_MS)
    }, MAP_CONTENT_MOUNT_DELAY_MS)

    return () => {
      clearTimeout(mapMountTimeout)
      if (offersMountTimeout) clearTimeout(offersMountTimeout)
    }
  }, [])

  useEffect(() => {
    return () => {
      clearMapLoadingTimeout()
      clearSelection()
    }
  }, [clearMapLoadingTimeout, clearSelection])

  return (
    <Stack
      flex={1}
      backgroundColor="$backgroundPrimary"
      onLayout={handleRootLayout}
    >
      <YStack flex={1} paddingTop={insets.top}>
        <NavigationBar
          style="back"
          title={t('tabBar.map')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
          rightActions={rightActions}
        />
        <Stack paddingVertical="$3">
          <FilterTagBar
            onSelectStart={showMapLoading}
            postSelectActions={refocusMapAfterOfferSetChange}
          />
        </Stack>
        <Stack flex={1} onLayout={handleMapAreaLayout}>
          {shouldRenderMap ? (
            <FullScreenMap
              bottomSheetRecenterKey={bottomSheetRecenterKey}
              bottomSheetVisibleHeight={bottomSheetVisibleHeight}
              fitEdgePadding={mapFitEdgePadding}
              mapHeight={mapHeight}
              onMapReady={hideMapLoadingAfterMarkersSettle}
            />
          ) : null}
        </Stack>
      </YStack>
      <MapBottomSheet
        containerHeight={screenHeight}
        visible={!selectedOffer}
        onSearchStart={showMapLoading}
        onSearchChange={handleSearchChange}
        onVisibleHeightChange={handleBottomSheetVisibleHeightChange}
        sheetTopOffset={mapTopOffset}
        shouldRenderOffers={shouldRenderOffers}
      />
      <SelectedOfferCard selectedOfferId={selectedOfferId} />
      <MapLoadingOverlay visible={isMapLoading || !shouldRenderMap} />
    </Stack>
  )
}

const styles = StyleSheet.create({
  loadingOverlay: {
    elevation: 100,
  },
})

export default MapViewScreen
