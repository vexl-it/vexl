import React, {useEffect} from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {getTokens, useTheme} from 'tamagui'

import {XStack} from '../primitives'

const RISE_DURATION = 240
const FALL_DURATION = 240
const REST_DURATION = 720
const STAGGER_DELAY = 160

function AnimatedDot({
  delay,
  color,
  dotSize,
  bounceHeight,
}: {
  readonly delay: number
  readonly color: string
  readonly dotSize: number
  readonly bounceHeight: number
}): React.JSX.Element {
  const translateY = useSharedValue(0)

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-bounceHeight, {
            duration: RISE_DURATION,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0, {
            duration: FALL_DURATION,
            easing: Easing.in(Easing.quad),
          }),
          withDelay(REST_DURATION, withTiming(0, {duration: 0}))
        ),
        -1
      )
    )
  }, [bounceHeight, delay, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }))

  return (
    <Animated.View
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  )
}

export function DotTypingIndicator(): React.JSX.Element {
  const theme = useTheme()
  const sizeTokens = getTokens().size
  const dotSize = Number(sizeTokens.$3.val)
  const bounceHeight = Number(sizeTokens.$3.val)
  const color = theme.foregroundTertiary.val

  return (
    <XStack alignItems="flex-end" gap="$2">
      <AnimatedDot
        delay={0}
        color={color}
        dotSize={dotSize}
        bounceHeight={bounceHeight}
      />
      <AnimatedDot
        delay={STAGGER_DELAY}
        color={color}
        dotSize={dotSize}
        bounceHeight={bounceHeight}
      />
      <AnimatedDot
        delay={STAGGER_DELAY * 2}
        color={color}
        dotSize={dotSize}
        bounceHeight={bounceHeight}
      />
    </XStack>
  )
}
