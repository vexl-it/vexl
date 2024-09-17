import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import {Stack, type ColorTokens} from 'tamagui'
interface AnimatedLiveIndicatorProps {
  color?: ColorTokens
}

export function AnimatedLiveIndicator({
  color,
}: AnimatedLiveIndicatorProps): JSX.Element {
  const opacity = useSharedValue(0)

  opacity.value = withRepeat(
    withTiming(1, {
      duration: 1000,
      easing: Easing.ease,
    }),
    -1,
    true
  )

  const animatedStyle = useAnimatedStyle(() => ({opacity: opacity.value}), [])

  return (
    <Animated.View style={animatedStyle}>
      <Stack h={8} w={8} bc={color} br="$5" />
    </Animated.View>
  )
}
