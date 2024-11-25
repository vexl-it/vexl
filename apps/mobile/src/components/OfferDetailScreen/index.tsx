import {isSome} from 'fp-ts/Option'
import {atom, useAtom, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {Platform, StyleSheet, type LayoutChangeEvent} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type AnimatedRef,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, YStack, getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useSingleOffer} from '../../state/marketplace'
import {focusOfferActionAtom} from '../../state/marketplace/atoms/map/focusedOffer'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useIsKeyboardShown from '../../utils/useIsKeyboardShown'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import {MAP_SIZE} from '../MarketplaceMap'
import MarketplaceMapContainer from '../MarketplaceMapContainer'
import Screen from '../Screen'
import OfferInfo from './components/OfferInfo'
import Title from './components/Title'

type Props = RootStackScreenProps<'OfferDetail'>

// this atom allows user to scroll back down while keyboard is shown
const userScrolledManuallyAtom = atom(false)

const HEADER_HEIGHT = 50

const styles = StyleSheet.create({
  mapContainer: {
    top: 0,
    left: 0,
    right: 0,
    position: 'absolute',
    zIndex: getTokens().zIndex[1].val,
  },
  titleContainer: {
    top: MAP_SIZE,
    left: 0,
    right: 0,
    position: 'absolute',
    zIndex: getTokens().zIndex[10].val,
  },
})

function OfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): JSX.Element {
  const animatedRef: AnimatedRef<Animated.ScrollView> = useAnimatedRef()
  const safeGoBack = useSafeGoBack()
  const setFocusedOffer = useSetAtom(focusOfferActionAtom)
  const {t} = useTranslation()
  const insets = useSafeAreaInsets()
  const isKeyboardShown = useIsKeyboardShown()
  const [userScrolledManually, setUserScrolledManually] = useAtom(
    userScrolledManuallyAtom
  )

  const offer = useSingleOffer(offerId)

  const scrollY = useSharedValue(0)
  const layoutY = useSharedValue(0)
  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
    runOnJS(setUserScrolledManually)(isKeyboardShown)
  })

  const stickyHeader = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [
        layoutY.value - insets.top - 1,
        layoutY.value - insets.top,
        layoutY.value - insets.top + 1,
      ],
      [0, 0, 1]
    )

    return {transform: [{translateY}]}
  })

  const mapOpacityAnimation = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, MAP_SIZE], [0, -MAP_SIZE])
    const opacity = interpolate(
      scrollY.value,
      [0, MAP_SIZE - (HEADER_HEIGHT + insets.top) / 0.9],
      [1, 0],
      Extrapolation.CLAMP
    )

    return {transform: [{translateY}], opacity}
  })

  useDerivedValue(() => {
    if (isKeyboardShown && !userScrolledManually && Platform.OS === 'ios')
      // Infinity is used to scroll to the bottom of the scroll view
      scrollTo(animatedRef, 0, Infinity, true)
  })

  useEffect(() => {
    if (!isKeyboardShown) {
      setUserScrolledManually(false)
    }
  }, [isKeyboardShown, setUserScrolledManually])

  useEffect(() => {
    setFocusedOffer(offerId)
    return () => {
      setFocusedOffer(null)
    }
  }, [offerId, setFocusedOffer])

  const RootContainer =
    isSome(offer) && offer.value.offerInfo.publicPart.location.length > 0
      ? Stack
      : Screen

  return (
    <RootContainer f={1} bc="$black">
      <>
        {isSome(offer) &&
          offer.value.offerInfo.publicPart.locationState.includes(
            'IN_PERSON'
          ) && (
            <Animated.View style={[mapOpacityAnimation, styles.mapContainer]}>
              <MarketplaceMapContainer />
            </Animated.View>
          )}
        {isSome(offer) ? (
          <Stack f={1}>
            {offer.value.offerInfo.publicPart.location.length > 0 ? (
              <>
                <Stack
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  height={insets.top}
                  backgroundColor="black"
                  zIndex="$10"
                />
                <Animated.ScrollView
                  ref={animatedRef}
                  overScrollMode="always"
                  scrollEventThrottle={16}
                  contentContainerStyle={{
                    paddingTop: MAP_SIZE + HEADER_HEIGHT,
                  }}
                  style={{
                    backgroundColor: getTokens().color.black.val,
                  }}
                  onScroll={handleScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <Animated.View
                    onLayout={(event: LayoutChangeEvent) => {
                      'worklet'
                      layoutY.value = event.nativeEvent.layout.y
                    }}
                    style={[stickyHeader, styles.titleContainer]}
                  >
                    <Title offer={offer.value} />
                  </Animated.View>
                  <OfferInfo
                    mapIsVisible
                    navigation={navigation}
                    offer={offer.value}
                  />
                </Animated.ScrollView>
              </>
            ) : (
              <OfferInfo navigation={navigation} offer={offer.value} />
            )}
          </Stack>
        ) : (
          <YStack
            f={1}
            p="$2"
            pt="0"
            gap="$5"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="$white" fs={20} ff="$body600" textAlign="center">
              {t('offer.offerNotFound')}
            </Text>
            <Button
              size="small"
              fullWidth
              variant="primary"
              onPress={safeGoBack}
              text={t('common.back')}
            />
          </YStack>
        )}
      </>
    </RootContainer>
  )
}

export default OfferDetailScreen
