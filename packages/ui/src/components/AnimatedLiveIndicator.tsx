import React, {useEffect} from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import {type ColorTokens} from 'tamagui'

import {Stack} from '../primitives'

export interface AnimatedLiveIndicatorProps {
  readonly color?: ColorTokens
}

/** Pulsing dot signalling a live value, e.g. the live BTC price. */
export function AnimatedLiveIndicator({
  color,
}: AnimatedLiveIndicatorProps): React.JSX.Element {
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {duration: 1000, easing: Easing.ease}),
      -1,
      true
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({opacity: opacity.value}), [])

  return (
    <Animated.View style={animatedStyle}>
      <Stack h={8} w={8} bc={color} br="$5" />
    </Animated.View>
  )
}
