import React, {useEffect, useRef, useState} from 'react'
import {type AccessibilityValue} from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import {styled} from 'tamagui'
import {Stack, XStack} from '../primitives'

const ProgressFill = styled(Stack, {
  name: 'ProgressFill',
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  backgroundColor: '$foregroundPrimary',
  borderRadius: '$11',
})

const AnimatedProgressFill = Animated.createAnimatedComponent(ProgressFill)

const ProgressTrack = styled(XStack, {
  name: 'ProgressTrack',
  position: 'relative',
  width: '100%',
  height: '$2',
  borderRadius: '$11',
  backgroundColor: '$backgroundTertiary',
  overflow: 'hidden',
})

export interface ProgressBarProps {
  readonly value: number
  readonly accessibilityLabel?: string
  readonly accessibilityValue?: AccessibilityValue
  readonly resetOnDecrease?: boolean
}

export function ProgressBar({
  value,
  accessibilityLabel,
  accessibilityValue,
  resetOnDecrease = false,
}: ProgressBarProps): React.JSX.Element {
  const [trackWidth, setTrackWidth] = useState(0)
  const boundedValue = Math.min(1, Math.max(0, value))
  const progress = useSharedValue(boundedValue)
  const previousValue = useRef(boundedValue)

  useEffect(() => {
    progress.value =
      resetOnDecrease && boundedValue < previousValue.current
        ? boundedValue
        : withTiming(boundedValue, {duration: 300})
    previousValue.current = boundedValue
  }, [boundedValue, progress, resetOnDecrease])

  const animatedStyle = useAnimatedStyle(() => ({
    width: progress.value * trackWidth,
  }))

  return (
    <ProgressTrack
      role="progressbar"
      aria-label={accessibilityLabel}
      aria-valuemin={accessibilityValue?.min ?? 0}
      aria-valuemax={accessibilityValue?.max ?? 1}
      aria-valuenow={accessibilityValue?.now ?? boundedValue}
      aria-valuetext={accessibilityValue?.text}
      onLayout={(event) => {
        setTrackWidth(event.nativeEvent.layout.width)
      }}
    >
      <AnimatedProgressFill style={animatedStyle} />
    </ProgressTrack>
  )
}

export function IndeterminateProgressBar(): React.JSX.Element {
  const [trackWidth, setTrackWidth] = useState(0)
  const position = useSharedValue(0)

  useEffect(() => {
    position.value = withRepeat(
      withTiming(1, {duration: 1200, easing: Easing.linear}),
      -1
    )
    return () => {
      cancelAnimation(position)
    }
  }, [position])

  const animatedStyle = useAnimatedStyle(() => {
    const fillWidth = trackWidth * 0.35
    return {
      width: fillWidth,
      transform: [
        {translateX: position.value * (trackWidth + fillWidth) - fillWidth},
      ],
    }
  })

  return (
    <ProgressTrack
      onLayout={(event) => {
        setTrackWidth(event.nativeEvent.layout.width)
      }}
    >
      <AnimatedProgressFill style={animatedStyle} />
    </ProgressTrack>
  )
}
