import {YStack} from '@vexl-next/ui/src/primitives'
import React, {useCallback, useEffect, useRef} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const ANIMATION_DURATION = 250

function AnimatedCollapse({
  expanded,
  animateOnMount = false,
  children,
}: {
  readonly expanded: boolean
  readonly animateOnMount?: boolean
  readonly children: React.ReactNode
}): React.JSX.Element {
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

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height
      if (height <= 0 || measuredHeight.value === height) return
      measuredHeight.value = height
      if (expanded) {
        if (animationEnabled.current) {
          animatedHeight.value = withTiming(height, {
            duration: ANIMATION_DURATION,
          })
        } else {
          animatedHeight.value = height
        }
      }
    },
    [animatedHeight, expanded, measuredHeight]
  )

  useEffect(() => {
    if (expanded) {
      if (measuredHeight.value > 0) {
        if (animationEnabled.current) {
          animatedHeight.value = withTiming(measuredHeight.value, {
            duration: ANIMATION_DURATION,
          })
        } else {
          animatedHeight.value = measuredHeight.value
        }
      }
    } else {
      if (animationEnabled.current) {
        animatedHeight.value = withTiming(0, {duration: ANIMATION_DURATION})
      } else {
        animatedHeight.value = 0
      }
    }
  }, [expanded, animatedHeight, measuredHeight])

  const clipStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden' as const,
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

export default AnimatedCollapse
