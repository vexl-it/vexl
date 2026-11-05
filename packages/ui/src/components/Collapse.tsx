import React, {useCallback, useEffect, useRef} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {YStack} from '../primitives'

const ANIMATION_DURATION = 250

export interface CollapseProps {
  readonly expanded: boolean
  readonly animateOnMount?: boolean
  readonly children: React.ReactNode
}

export function Collapse({
  expanded,
  animateOnMount = false,
  children,
}: CollapseProps): React.JSX.Element {
  const measuredHeight = useSharedValue(0)
  const animatedHeight = useSharedValue(0)
  const animationEnabled = useRef(animateOnMount)

  useEffect(() => {
    if (animateOnMount) return

    const timer = setTimeout(() => {
      animationEnabled.current = true
    }, ANIMATION_DURATION)
    return () => {
      clearTimeout(timer)
    }
  }, [animateOnMount])

  const animateHeightTo = useCallback(
    (height: number) => {
      animatedHeight.value = animationEnabled.current
        ? withTiming(height, {duration: ANIMATION_DURATION})
        : height
    },
    [animatedHeight]
  )

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height
      if (height <= 0 || measuredHeight.value === height) return
      measuredHeight.value = height
      if (expanded) animateHeightTo(height)
    },
    [animateHeightTo, expanded, measuredHeight]
  )

  useEffect(() => {
    if (!expanded) {
      animateHeightTo(0)
    } else if (measuredHeight.value > 0) {
      animateHeightTo(measuredHeight.value)
    }
  }, [expanded, animateHeightTo, measuredHeight])

  const clipStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden',
  }))

  return (
    <Animated.View style={clipStyle}>
      <YStack
        position="absolute"
        left={0}
        right={0}
        top={0}
        onLayout={handleLayout}
      >
        {children}
      </YStack>
    </Animated.View>
  )
}
