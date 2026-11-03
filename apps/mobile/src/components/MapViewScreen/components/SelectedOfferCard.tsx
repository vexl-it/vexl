import {useNavigation} from '@react-navigation/native'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {FadeGradient, Stack} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import Animated, {
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {getTokens} from 'tamagui'
import OfferOnMarketplace from '../../OfferOnMarketplace'
import {mapViewSelectedOfferAtom} from '../atoms'

const FOCUSED_CARD_BOTTOM_OFFSET =
  getTokens().space.$8.val + getTokens().space.$2.val
const FOCUSED_CARD_GRADIENT_TOP_PADDING = getTokens().space.$13.val
const FOCUSED_CARD_HIDDEN_TRANSLATE_Y =
  getTokens().space.$13.val + getTokens().space.$12.val
const AnimatedStack = Animated.createAnimatedComponent(Stack)

interface Props {
  readonly selectedOfferId: OfferId | null
}

function SelectedOfferCard({selectedOfferId}: Props): React.JSX.Element | null {
  const navigation = useNavigation()
  const selectedOffer = useAtomValue(mapViewSelectedOfferAtom)
  const selectedOfferToRender =
    selectedOffer?.offerInfo.offerId === selectedOfferId ? selectedOffer : null
  const visibleProgress = useSharedValue(0)

  useEffect(() => {
    visibleProgress.value = withTiming(selectedOfferToRender ? 1 : 0, {
      duration: 280,
    })
  }, [selectedOfferToRender, visibleProgress])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: visibleProgress.value,
    transform: [
      {
        translateY:
          (1 - visibleProgress.value) * FOCUSED_CARD_HIDDEN_TRANSLATE_Y,
      },
    ],
  }))

  const onPress = useCallback(() => {
    if (!selectedOfferToRender) return
    navigation.navigate('OfferDetail', {
      offerId: selectedOfferToRender.offerInfo.offerId,
    })
  }, [navigation, selectedOfferToRender])

  if (!selectedOfferToRender) return null

  return (
    <AnimatedStack
      pointerEvents="box-none"
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      paddingTop={FOCUSED_CARD_GRADIENT_TOP_PADDING}
      paddingBottom={FOCUSED_CARD_BOTTOM_OFFSET}
      style={containerStyle}
    >
      <FadeGradient solidEdge="bottom" solidFraction={0.3} />
      <Stack paddingHorizontal="$5">
        <Animated.View
          key={selectedOfferToRender.offerInfo.offerId}
          entering={SlideInDown.duration(260)}
          exiting={SlideOutDown.duration(220)}
        >
          <OfferOnMarketplace offer={selectedOfferToRender} onPress={onPress} />
        </Animated.View>
      </Stack>
    </AnimatedStack>
  )
}

export default SelectedOfferCard
