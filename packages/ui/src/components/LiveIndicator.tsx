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

export interface LiveIndicatorProps {
  readonly color?: ColorTokens
}

export function LiveIndicator({
  color = '$accentYellowPrimary',
}: LiveIndicatorProps): React.JSX.Element {
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {duration: 1000, easing: Easing.ease}),
      -1,
      true
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({opacity: opacity.value}))

  return (
    <Animated.View style={animatedStyle}>
      <Stack width="$3" height="$3" borderRadius="$5" backgroundColor={color} />
    </Animated.View>
  )
}
