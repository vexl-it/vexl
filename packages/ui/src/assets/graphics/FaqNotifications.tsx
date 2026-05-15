import type {ReactNode} from 'react'
import React, {useCallback, useEffect, useState} from 'react'
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, {G, Path} from 'react-native-svg'

import {useResolvedGraphicVariant} from './useResolvedGraphicVariant'

interface Props {
  readonly variant?: 'dark' | 'light'
  readonly width?: number
  readonly height?: number
  readonly animate?: boolean
  readonly disableReplayOnPress?: boolean
}

const AnimatedGroup = Animated.createAnimatedComponent(G)

const POP_DELAY = 90
const POP_IN_DURATION = 190
const POP_SETTLE_DURATION = 130

function AnimatedSvgPart({
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

  useEffect(() => {
    if (!animate) {
      progress.value = 1
      return
    }

    progress.value = 0
    progress.value = withDelay(
      index * POP_DELAY,
      withSequence(
        withTiming(0.82, {
          duration: POP_IN_DURATION,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(1, {
          duration: POP_SETTLE_DURATION,
          easing: Easing.out(Easing.quad),
        })
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

  return <AnimatedGroup animatedProps={animatedProps}>{children}</AnimatedGroup>
}

export function FaqNotifications({
  variant,
  width = 182,
  height = 189,
  animate = false,
  disableReplayOnPress = false,
}: Props): React.JSX.Element {
  const resolvedVariant = useResolvedGraphicVariant(variant)
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const retriggerAnimation = useCallback(() => {
    if (animate) setAnimationTrigger((current) => current + 1)
  }, [animate])

  // prettier-ignore
  return (<Svg width={width} height={height} viewBox="0 0 182.301 188.629" fill="none" onPress={animate && !disableReplayOnPress ? retriggerAnimation : undefined}><G><AnimatedSvgPart animate={animate} index={0} trigger={animationTrigger} originX={91} originY={89}><Path d="M181.846 78.4478L6.81467e-09 78.4479L90.9228 0L181.846 78.4478Z" fill="#FCCD6C" /><Path d="M0.455487 78.4477L182.301 78.4477L91.3783 133.562L0.455487 78.4477Z" fill="#EEB338" /><Path d="M24.2914 181.304L163.943 41.6518L163.943 181.304L24.2914 181.304Z" fill={resolvedVariant === 'dark' ? "#F2F2F2" : "black"} /><Path d="M163.944 41.6513L24.2919 181.303L24.2919 41.6513L163.944 41.6513Z" fill={resolvedVariant === 'dark' ? "white" : "#333333"} /><Path d="M0.535565 188.629L0.535528 78.4L91.4584 133.515L0.535565 188.629Z" fill="#82C492" /><Path d="M181.846 188.305L0.000488247 188.305L90.9233 133.191L181.846 188.305Z" fill="#EEB338" /><Path d="M182.223 78.4001L182.223 188.629L91.3003 133.515L182.223 78.4001Z" fill="#FCCD6C" /><Path d="M0.533612 78.4001L0.533597 188.629L91.4564 133.515L0.533612 78.4001Z" fill="#FCCD6C" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={1} trigger={animationTrigger} originX={91} originY={74}><Path d="M103.838 86.4269L79.385 61.9736L103.838 61.9736L103.838 86.4269Z" fill="#ACD9B7" /><Path d="M79.3832 61.9733L103.837 86.4267L79.3832 86.4267L79.3832 61.9733Z" fill="#88C797" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={2} trigger={animationTrigger} originX={125} originY={74}><Path d="M137.461 86.4268C130.636 86.4268 113.008 86.4268 113.008 86.4268C113.008 79.6742 118.541 74.2001 125.366 74.2001L137.461 74.2001L137.461 86.4268Z" fill="#FBA5EC" /><Path d="M113.006 61.9735C119.831 61.9735 137.46 61.9735 137.46 61.9735C137.46 68.7261 131.927 74.2001 125.102 74.2001L113.006 74.2001L113.006 61.9735Z" fill="#FCC5F3" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={3} trigger={animationTrigger} originX={58} originY={74}><Path d="M57.9868 86.4268C64.7394 86.4268 70.2135 80.9527 70.2135 74.2001L45.7602 74.2001C45.7602 80.9527 51.2342 86.4268 57.9868 86.4268Z" fill="#FCCD6C" /><Path d="M57.9866 61.9735C51.234 61.9735 45.76 67.572 45.76 74.2001L70.2133 74.2001C70.2133 67.572 64.7392 61.9735 57.9866 61.9735Z" fill="#EEB338" /></AnimatedSvgPart></G></Svg>)
}
