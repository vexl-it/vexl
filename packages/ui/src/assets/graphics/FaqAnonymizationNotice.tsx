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
import Svg, {Circle, G, Path} from 'react-native-svg'
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

export function FaqAnonymizationNotice({
  variant,
  width = 257,
  height = 256,
  animate = false,
  disableReplayOnPress = false,
}: Props): React.JSX.Element {
  const resolvedVariant = useResolvedGraphicVariant(variant)
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const retriggerAnimation = useCallback(() => {
    if (animate) setAnimationTrigger((current) => current + 1)
  }, [animate])

  // prettier-ignore
  return (<Svg width={width} height={height} viewBox="0 0 257 256" fill="none" onPress={animate && !disableReplayOnPress ? retriggerAnimation : undefined}><AnimatedSvgPart animate={animate} index={0} trigger={animationTrigger} originX={128.25} originY={128.75}><G transform="translate(47.75, 48.25) rotate(-90, 80.5, 80.5)"><Path d="M0 0L161 161H0V0Z" fill="black" /></G><G transform="translate(47.75, 48.25) rotate(90, 80.5, 80.5)"><Path d="M0 0L161 161H0V0Z" fill={resolvedVariant === 'dark' ? "#6B6B6B" : "#333333"} /></G></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={1} trigger={animationTrigger} originX={24} originY={24}><G transform="translate(0, 0) rotate(-90, 24, 24)"><Path opacity="0.5" d="M0 0L48 48H0V0Z" fill={resolvedVariant === 'dark' ? "#DBDBDB" : "#333333"} /></G></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={2} trigger={animationTrigger} originX={233} originY={233}><G transform="translate(209, 209) rotate(90, 24, 24)"><Path opacity="0.7" d="M0 0L48 48H0V0Z" fill="black" /></G></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={3} trigger={animationTrigger} originX={128.25} originY={128}><G transform="translate(73.04, 95.63)"><Path d="M110.405 33.1214C110.405 33.1214 100.576 33.1214 55.2024 33.1214C9.82605 33.1214 0 33.1214 0 33.1214C0 33.1214 19.8261 0 55.2024 0C90.5761 0 110.405 33.1214 110.405 33.1214Z" fill="white" /></G><G transform="translate(73.04, 128) rotate(180, 55.2025, 16.5605)"><Path d="M110.405 33.1214C110.405 33.1214 100.576 33.1214 55.2024 33.1214C9.82605 33.1214 0 33.1214 0 33.1214C0 33.1214 19.8261 0 55.2024 0C90.5761 0 110.405 33.1214 110.405 33.1214Z" fill="white" /></G></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={4} trigger={animationTrigger} originX={128.486} originY={128.996}><G transform="translate(90.8845, 105.195) rotate(135, 27.601, 13.8005)"><Path d="M27.6012 27.6012C42.8449 27.6012 55.2024 15.2437 55.2024 0L0 0C0 15.2437 12.3575 27.6012 27.6012 27.6012Z" fill="#A4D5AF" /></G><G transform="translate(110.40450000000001, 124.715) rotate(-45, 27.601, 13.8005)"><Path d="M27.6012 27.6012C42.8449 27.6012 55.2024 14.9628 55.2024 0H0C0 14.9628 12.3575 27.6012 27.6012 27.6012Z" fill="#82C492" /></G></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={5} trigger={animationTrigger} originX={128.42025} originY={72.54525}><G transform="translate(120.345, 64.465) rotate(45, 8.075, 8.075)"><Path d="M0 0L16.1505 16.1505H0V0Z" fill="#FBA5EC" /></G><G transform="translate(120.345, 64.47500000000001) rotate(-135, 8.075, 8.075)"><Path d="M0 0L16.1505 16.1505H0V0Z" fill="#FCC4F3" /></G></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={6} trigger={animationTrigger} originX={128.42025} originY={185.60025}><G transform="translate(120.345, 177.525) rotate(45, 8.075, 8.075)"><Path d="M0 0L16.1505 16.1505H0V0Z" fill="#FCCD6C" /></G><G transform="translate(120.345, 177.525) rotate(-135, 8.075, 8.075)"><Path d="M0 0L16.1505 16.1505H0V0Z" fill="#EEB338" /></G></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={7} trigger={animationTrigger} originX={128} originY={129}><G transform="translate(120, 121)"><Circle cx="8" cy="8" r="8" fill="#101010" /></G></AnimatedSvgPart></Svg>)
}
