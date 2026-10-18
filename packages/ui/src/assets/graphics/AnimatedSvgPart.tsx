import type {ReactNode} from 'react'
import React, {useEffect, useState} from 'react'
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {G} from 'react-native-svg'
import {scheduleOnRN} from 'react-native-worklets'

const AnimatedGroup = Animated.createAnimatedComponent(G)

const POP_DELAY = 90
const POP_IN_DURATION = 190
const POP_SETTLE_DURATION = 130

export function AnimatedSvgPart({
  animate,
  index,
  trigger,
  originX,
  originY,
  children,
}: {
  readonly animate: boolean
  readonly index: number
  readonly trigger: number
  readonly originX: number
  readonly originY: number
  readonly children: ReactNode
}): React.JSX.Element {
  const progress = useSharedValue(animate ? 0 : 1)
  const [settled, setSettled] = useState(!animate)

  useEffect(() => {
    if (!animate) {
      progress.value = 1
      setSettled(true)
      return
    }

    setSettled(false)
    progress.value = 0
    progress.value = withDelay(
      index * POP_DELAY,
      withSequence(
        withTiming(0.82, {
          duration: POP_IN_DURATION,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(
          1,
          {
            duration: POP_SETTLE_DURATION,
            easing: Easing.out(Easing.quad),
          },
          (finished) => {
            if (finished) scheduleOnRN(setSettled, true)
          }
        )
      )
    )
  }, [animate, index, progress, trigger])

  const animatedProps = useAnimatedProps(() => {
    const scale = interpolate(progress.value, [0, 0.82, 1], [0.5, 1.12, 1])

    return {
      opacity: progress.value,
      transform: `translate(${originX} ${originY}) scale(${scale}) translate(${-originX} ${-originY})`,
    }
  })

  // Reanimated can drop the final values before syncing them back to React when
  // the JS thread is busy, so a later re-render would restore the hidden
  // first-frame props. Once settled, render without animated props instead.
  return (
    <AnimatedGroup animatedProps={settled ? undefined : animatedProps}>
      {children}
    </AnimatedGroup>
  )
}
