import {LinearGradient} from 'expo-linear-gradient'
import {isSome} from 'fp-ts/Option'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {Platform} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, YStack, getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useSingleOffer} from '../../state/marketplace'
import {focusOfferActionAtom} from '../../state/marketplace/atoms/map/focusedOffer'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import {MAP_SIZE} from '../MarketplaceMap'
import MarketplaceMapContainer from '../MarketplaceMapContainer'
import Screen from '../Screen'
import OfferInfo from './components/OfferInfo'
import Title from './components/Title'

type Props = RootStackScreenProps<'OfferDetail'>

function OfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const setFocusedOffer = useSetAtom(focusOfferActionAtom)
  const {t} = useTranslation()
  const {top} = useSafeAreaInsets()

  const offer = useSingleOffer(offerId)

  const scrollY = useSharedValue(0)
  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })

  const scrollAnimatedStyles = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 260],
      [0, -MAP_SIZE],
      Extrapolation.CLAMP
    )

    return {transform: [{translateY}]}
  })

  const safeTopAnimatedHeight = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 180],
      [0, top],
      Extrapolation.CLAMP
    )

    return {height}
  })

  const animatedMapStyles = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [0, 320], [1.0, 1.3], {
      extrapolateRight: Extrapolation.CLAMP,
      extrapolateLeft: Extrapolation.CLAMP,
    })
    return {transform: [{scale}]}
  })

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
            <Animated.View style={animatedMapStyles}>
              <MarketplaceMapContainer />
            </Animated.View>
          )}
        {isSome(offer) ? (
          <>
            {offer.value.offerInfo.publicPart.location.length > 0 ? (
              <Animated.View style={scrollAnimatedStyles}>
                <Stack mah={top}>
                  <Animated.View style={safeTopAnimatedHeight}>
                    <LinearGradient
                      colors={[
                        'transparent',
                        'transparent',
                        getTokens().color.black.val,
                      ]}
                      style={{flex: 1}}
                    />
                  </Animated.View>
                </Stack>
                <Title offer={offer.value} />
                <Animated.ScrollView
                  overScrollMode="always"
                  contentContainerStyle={{
                    paddingBottom: Platform.OS === 'ios' ? MAP_SIZE : 0,
                  }}
                  style={{
                    backgroundColor: getTokens().color.black.val,
                  }}
                  onScroll={handleScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <OfferInfo
                    mapIsVisible
                    navigation={navigation}
                    offer={offer.value}
                  />
                </Animated.ScrollView>
              </Animated.View>
            ) : (
              <OfferInfo navigation={navigation} offer={offer.value} />
            )}
          </>
        ) : (
          <YStack
            f={1}
            p="$2"
            pt="0"
            space="$5"
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
