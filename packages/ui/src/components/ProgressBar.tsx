import React, {useEffect, useRef, useState} from 'react'
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
  name: 'ProgressBar',
  position: 'relative',
  width: '100%',
  height: '$2',
  borderRadius: '$11',
  backgroundColor: '$backgroundTertiary',
  overflow: 'hidden',
})

export interface ProgressBarProps {
  /** 0–100. Without it, the bar shows an indeterminate animation. */
  readonly percentage?: number
}

export function ProgressBar({percentage}: ProgressBarProps): React.JSX.Element {
  return percentage === undefined ? (
    <IndeterminateProgressBar />
  ) : (
    <DeterminateProgressBar percentage={percentage} />
  )
}

function DeterminateProgressBar({
  percentage,
}: {
  readonly percentage: number
}): React.JSX.Element {
  const [trackWidth, setTrackWidth] = useState(0)
  const progress = useSharedValue(percentage)
  const previousPercentage = useRef(percentage)

  useEffect(() => {
    if (percentage < previousPercentage.current) {
      progress.value = percentage
    } else {
      progress.value = withTiming(percentage)
    }
    previousPercentage.current = percentage
  }, [percentage, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    width: (progress.value * trackWidth) / 100,
  }))

  return (
    <ProgressTrack
      onLayout={(e) => {
        setTrackWidth(e.nativeEvent.layout.width)
      }}
    >
      <AnimatedProgressFill style={animatedStyle} />
    </ProgressTrack>
  )
}

function IndeterminateProgressBar(): React.JSX.Element {
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
        {
          translateX: position.value * (trackWidth + fillWidth) - fillWidth,
        },
      ],
    }
  })

  return (
    <ProgressTrack
      onLayout={(e) => {
        setTrackWidth(e.nativeEvent.layout.width)
      }}
    >
      <AnimatedProgressFill style={animatedStyle} />
    </ProgressTrack>
  )
}
