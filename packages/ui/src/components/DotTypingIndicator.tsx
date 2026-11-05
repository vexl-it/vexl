import {Array, pipe} from 'effect'
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

export type DotTypingIndicatorSize = 'small' | 'large'

export interface DotTypingIndicatorProps {
  readonly size?: DotTypingIndicatorSize
  readonly color?: string
}

const dotSizeToken = {
  small: '$3',
  large: '$4',
} as const satisfies Record<DotTypingIndicatorSize, string>

export function DotTypingIndicator({
  size = 'small',
  color,
}: DotTypingIndicatorProps): React.JSX.Element {
  const theme = useTheme()
  const dotSize = getTokens().size[dotSizeToken[size]].val
  const resolvedColor = color ?? theme.foregroundPrimary.get()

  return (
    <XStack alignItems="flex-end" gap="$2">
      {pipe(
        [0, STAGGER_DELAY, STAGGER_DELAY * 2],
        Array.map((delay) => (
          <AnimatedDot
            key={delay}
            delay={delay}
            color={resolvedColor}
            dotSize={dotSize}
            bounceHeight={dotSize}
          />
        ))
      )}
    </XStack>
  )
}
