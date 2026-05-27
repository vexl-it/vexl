import {useNavigation} from '@react-navigation/native'
import {FlashList, type ListRenderItemInfo} from '@shopify/flash-list'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Button, Loader, Typography} from '@vexl-next/ui'
import {Stack, XStack, YStack} from '@vexl-next/ui/src/primitives'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Dimensions, StyleSheet} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {useReanimatedKeyboardAnimation} from 'react-native-keyboard-controller'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {scheduleOnRN} from 'react-native-worklets'
import {getTokens} from 'tamagui'
import {filteredOffersForVisibleMapRegionAtom} from '../../../state/marketplace/atoms/filteredOffers'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SearchOffers from '../../InsideRouter/components/MarketplaceScreen/components/SearchOffers'
import OfferOnMarketplace from '../../OfferOnMarketplace'
import {selectMapViewOfferActionAtom} from '../atoms'

const {height: DEFAULT_SCREEN_HEIGHT} = Dimensions.get('window')
const tokens = getTokens()

const HEADER_CONTENT_HEIGHT = 64
const HEADER_BOTTOM_GAP = tokens.space.$5.val
const HEADER_HEIGHT = HEADER_CONTENT_HEIGHT + HEADER_BOTTOM_GAP
const KEYBOARD_BOTTOM_GAP = tokens.space.$3.val
const SHEET_SHADOW_OFFSET_Y = -tokens.space.$3.val
const SHEET_SHADOW_RADIUS = tokens.space.$6.val
const FULL_Y = 0
export const MAP_BOTTOM_SHEET_MIDDLE_VISIBLE_HEIGHT_RATIO = 0.45

const TIMING_CONFIG = {duration: 280}
const AnimatedStack = Animated.createAnimatedComponent(Stack)

const mapOffersSplitAtom = splitAtom(
  filteredOffersForVisibleMapRegionAtom,
  (offer) => offer.offerInfo.offerId
)

interface Props {
  readonly containerHeight: number
  readonly visible: boolean
  readonly onSearchStart?: () => void
  readonly onSearchChange?: () => void
  readonly onVisibleHeightChange?: (change: {
    readonly height: number
    readonly recenterMap: boolean
  }) => void
  readonly sheetTopOffset: number
  readonly shouldRenderOffers: boolean
}

function BottomSheetRow({
  offerAtom,
}: {
  readonly offerAtom: Atom<OneOfferInState>
}): React.JSX.Element {
  const offer = useAtomValue(offerAtom)
  const selectOffer = useSetAtom(selectMapViewOfferActionAtom)

  const onPress = useCallback(() => {
    selectOffer(offer.offerInfo.offerId)
  }, [offer.offerInfo.offerId, selectOffer])

  return <OfferOnMarketplace offer={offer} onPress={onPress} />
}

function BottomSheetItemSeparator(): React.JSX.Element {
  return <Stack h="$3" />
}

function OffersListLoader(): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap="$3"
      paddingVertical="$8"
    >
      <Loader size="medium" />
      <Typography color="$foregroundPrimary" variant="paragraphSmall">
        {t('marketplace.loadingOffers')}
      </Typography>
    </YStack>
  )
}

function OffersListEmptyState(): React.JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const handleEditFiltersPress = useCallback(() => {
    navigation.navigate('FilterOffers')
  }, [navigation])

  return (
    <YStack alignItems="center" gap="$4" paddingTop="$6" paddingHorizontal="$5">
      <Typography
        color="$foregroundPrimary"
        textAlign="center"
        variant="heading3"
      >
        {t('marketplace.noOffersYet')}
      </Typography>
      <Typography
        color="$foregroundSecondary"
        textAlign="center"
        variant="description"
      >
        {t('marketplace.tryAdjustingMapOrClearingFilters')}
      </Typography>
      <Button
        variant="tertiary"
        size="small"
        onPress={handleEditFiltersPress}
        width="100%"
      >
        {t('marketplace.editFilters')}
      </Button>
    </YStack>
  )
}

function renderOfferItem({
  item,
}: ListRenderItemInfo<Atom<OneOfferInState>>): React.JSX.Element {
  return <BottomSheetRow offerAtom={item} />
}

function BottomSheetOfferList(): React.JSX.Element {
  const [listLoaded, setListLoaded] = useState(false)
  const offerAtoms = useAtomValue(mapOffersSplitAtom)

  const handleListLoad = useCallback(() => {
    setListLoaded(true)
  }, [])

  useEffect(() => {
    if (offerAtoms.length === 0) setListLoaded(true)
  }, [offerAtoms.length])

  return (
    <Stack flex={1}>
      <FlashList
        data={offerAtoms}
        renderItem={renderOfferItem}
        keyExtractor={atomKeyExtractor}
        ItemSeparatorComponent={BottomSheetItemSeparator}
        ListEmptyComponent={OffersListEmptyState}
        onLoad={handleListLoad}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: getTokens().space.$3.val,
          paddingBottom: getTokens().space.$10.val,
          paddingHorizontal: getTokens().space.$5.val,
        }}
      />
      {!listLoaded ? (
        <Stack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          backgroundColor="$backgroundPrimary"
        >
          <OffersListLoader />
        </Stack>
      ) : null}
    </Stack>
  )
}

function MapBottomSheet({
  containerHeight,
  visible,
  onSearchStart,
  onSearchChange,
  onVisibleHeightChange,
  sheetTopOffset,
  shouldRenderOffers,
}: Props): React.JSX.Element | null {
  const insets = useSafeAreaInsets()
  const {height: keyboardHeight, progress: keyboardProgress} =
    useReanimatedKeyboardAnimation()
  const availableHeight = containerHeight || DEFAULT_SCREEN_HEIGHT
  const sheetHeight = Math.max(
    HEADER_HEIGHT + insets.bottom,
    availableHeight - sheetTopOffset
  )
  const snapMiddleVisibleHeight = Math.round(
    availableHeight * MAP_BOTTOM_SHEET_MIDDLE_VISIBLE_HEIGHT_RATIO
  )
  const middleY = Math.max(FULL_Y, sheetHeight - snapMiddleVisibleHeight)
  const collapsedY = sheetHeight - HEADER_HEIGHT - insets.bottom
  const translateY = useSharedValue(sheetHeight)
  const startY = useSharedValue(middleY)
  const wasFullyExpandedSnapRef = useRef(false)
  const [listViewportHeight, setListViewportHeight] = useState(0)

  const getSheetVisibleHeight = useCallback(
    (sheetTranslateY: number) => Math.max(0, sheetHeight - sheetTranslateY),
    [sheetHeight]
  )

  const updateSheetVisibleHeight = useCallback(
    (sheetTranslateY: number) => {
      if (sheetTranslateY <= FULL_Y) {
        wasFullyExpandedSnapRef.current = true
        return
      }

      const isCollapsedSnap = sheetTranslateY >= collapsedY
      const recenterMap = !(wasFullyExpandedSnapRef.current && isCollapsedSnap)
      wasFullyExpandedSnapRef.current = false

      onVisibleHeightChange?.({
        height: getSheetVisibleHeight(sheetTranslateY),
        recenterMap,
      })
    },
    [collapsedY, getSheetVisibleHeight, onVisibleHeightChange]
  )

  const getListViewportHeight = useCallback(
    (sheetTranslateY: number) => {
      if (sheetTranslateY >= collapsedY) return 0

      return Math.max(0, sheetHeight - HEADER_HEIGHT - sheetTranslateY)
    },
    [collapsedY, sheetHeight]
  )

  const updateListViewportHeight = useCallback(
    (sheetTranslateY: number) => {
      setListViewportHeight(getListViewportHeight(sheetTranslateY))
    },
    [getListViewportHeight]
  )

  useEffect(() => {
    if (!visible) {
      translateY.value = sheetHeight
      updateListViewportHeight(sheetHeight)
    } else {
      translateY.value = withTiming(middleY, TIMING_CONFIG)
      updateListViewportHeight(middleY)
      updateSheetVisibleHeight(middleY)
    }
  }, [
    middleY,
    sheetHeight,
    translateY,
    updateListViewportHeight,
    updateSheetVisibleHeight,
    visible,
  ])

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet'
          startY.value = translateY.value
        })
        .onUpdate((event) => {
          'worklet'
          const next = Math.max(
            FULL_Y,
            Math.min(collapsedY, startY.value + event.translationY)
          )
          translateY.value = next
        })
        .onEnd((event) => {
          'worklet'
          const projected = translateY.value + event.velocityY * 0.15
          const snapPoints = [FULL_Y, middleY, collapsedY]
          let nearest = middleY
          let bestDistance = Number.POSITIVE_INFINITY
          for (const point of snapPoints) {
            const distance = Math.abs(projected - point)
            if (distance < bestDistance) {
              bestDistance = distance
              nearest = point
            }
          }
          translateY.value = withTiming(nearest, TIMING_CONFIG)
          scheduleOnRN(updateListViewportHeight, nearest)
          scheduleOnRN(updateSheetVisibleHeight, nearest)
        }),
    [
      collapsedY,
      middleY,
      startY,
      translateY,
      updateListViewportHeight,
      updateSheetVisibleHeight,
    ]
  )

  const shadowProgressStyle = useAnimatedStyle(() => {
    const shadowProgress = interpolate(
      translateY.value,
      [FULL_Y, FULL_Y + 16],
      [0, 1],
      Extrapolation.CLAMP
    )

    return {
      elevation: 28 * shadowProgress,
      shadowOpacity: 0.25 * shadowProgress,
    }
  })

  const visibleTranslateY = useDerivedValue(() => {
    if (!visible || keyboardProgress.value <= 0) return translateY.value

    const keyboardVisibleHeight = Math.max(0, -keyboardHeight.value)
    const sheetTopY = availableHeight - sheetHeight + translateY.value
    const searchBottomY = sheetTopY + HEADER_HEIGHT
    const keyboardTopY = availableHeight - keyboardVisibleHeight
    const keyboardLift = Math.max(
      0,
      searchBottomY + KEYBOARD_BOTTOM_GAP - keyboardTopY
    )

    return Math.max(FULL_Y, translateY.value - keyboardLift)
  })

  const sheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: visibleTranslateY.value}],
    }
  })

  const collapsedListOffset = Math.max(insets.bottom, tokens.space.$3.val)
  const scrollAreaStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            translateY.value,
            [collapsedY - HEADER_BOTTOM_GAP, collapsedY],
            [0, collapsedListOffset],
            Extrapolation.CLAMP
          ),
        },
      ],
    }
  })

  const handleSearchFocus = useCallback(() => {
    const nextTranslateY = Math.min(translateY.value, middleY)

    translateY.value = withTiming(nextTranslateY, TIMING_CONFIG)
    updateListViewportHeight(nextTranslateY)
    updateSheetVisibleHeight(nextTranslateY)
  }, [middleY, translateY, updateListViewportHeight, updateSheetVisibleHeight])

  if (!visible) return null

  return (
    <AnimatedStack
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      zIndex={20}
      borderTopLeftRadius="$9"
      borderTopRightRadius="$9"
      backgroundColor="$backgroundPrimary"
      height={sheetHeight}
      style={sheetStyle}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <AnimatedStack
        pointerEvents="none"
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        borderTopLeftRadius="$9"
        borderTopRightRadius="$9"
        backgroundColor="$backgroundPrimary"
        style={[styles.shadowSurface, shadowProgressStyle]}
      />
      <Stack
        backgroundColor="$backgroundPrimary"
        borderTopLeftRadius="$9"
        borderTopRightRadius="$9"
        flex={1}
        overflow="hidden"
      >
        <GestureDetector gesture={panGesture}>
          <YStack
            height={HEADER_HEIGHT}
            paddingTop="$2"
            paddingBottom="$5"
            alignItems="center"
            backgroundColor="$backgroundPrimary"
            gap="$3"
            zIndex={2}
          >
            <Stack
              width={36}
              height={4}
              borderRadius="$2"
              backgroundColor="$foregroundTertiary"
            />
            <XStack
              width="100%"
              paddingHorizontal="$5"
              onTouchStart={handleSearchFocus}
            >
              <SearchOffers
                onSearchStart={onSearchStart}
                postSearchActions={onSearchChange}
              />
            </XStack>
          </YStack>
        </GestureDetector>
        <AnimatedStack
          overflow="hidden"
          height={listViewportHeight}
          style={scrollAreaStyle}
        >
          {shouldRenderOffers ? <BottomSheetOfferList /> : <OffersListLoader />}
        </AnimatedStack>
      </Stack>
    </AnimatedStack>
  )
}

const styles = StyleSheet.create({
  shadowSurface: {
    shadowColor: tokens.color.black100.val,
    shadowOffset: {width: tokens.space.$0.val, height: SHEET_SHADOW_OFFSET_Y},
    shadowRadius: SHEET_SHADOW_RADIUS,
  },
})

export default MapBottomSheet
