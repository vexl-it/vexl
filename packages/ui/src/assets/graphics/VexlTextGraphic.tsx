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

export function VexlTextGraphic({
  variant,
  width = 89,
  height = 27,
  animate = false,
}: Props): React.JSX.Element {
  const resolvedVariant = useResolvedGraphicVariant(variant)
  const fill = resolvedVariant === 'light' ? 'white' : 'black'
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const retriggerAnimation = useCallback(() => {
    if (animate) setAnimationTrigger((current) => current + 1)
  }, [animate])

  // prettier-ignore
  return (<Svg width={width} height={height} viewBox="0 0 89 27" fill="none" onPress={animate ? retriggerAnimation : undefined}><G><AnimatedSvgPart animate={animate} index={0} trigger={animationTrigger} originX={14.5} originY={16.5}><Path d="M14.6241 22.8183L22.705 6.78293H29.2482L19.3025 26.3415H9.9457L0 6.78293H6.5105L14.6241 22.8183Z" fill={fill} /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={1} trigger={animationTrigger} originX={41} originY={16.5}><Path d="M41.6847 22.1268C43.6258 22.1268 45.1199 21.9073 46.1668 21.4683C47.2137 21.0073 47.9443 20.3598 48.3588 19.5256H54.673C54.0186 21.9402 52.6009 23.7951 50.4199 25.0902C48.2388 26.3634 45.2616 27 41.4884 27C37.148 27 33.7347 26.111 31.2482 24.3329C28.7618 22.5549 27.5186 19.9646 27.5186 16.5622C27.5186 14.3012 28.0966 12.3915 29.2525 10.8329C30.4303 9.25244 32.0443 8.07805 34.0945 7.30976C36.1447 6.51951 38.5003 6.12439 41.1612 6.12439C45.4143 6.12439 48.7622 7.07927 51.2051 8.98902C53.6479 10.8768 54.8693 13.7963 54.8693 17.7476H33.9964C34.2363 19.328 34.9888 20.4585 36.2538 21.139C37.5188 21.7976 39.3291 22.1268 41.6847 22.1268ZM41.1612 10.5695C39.2855 10.5695 37.7696 10.8549 36.6137 11.4256C35.4577 11.9744 34.6725 12.8744 34.2581 14.1256H48.2279C47.8135 12.8744 47.0174 11.9744 45.8396 11.4256C44.6836 10.8549 43.1242 10.5695 41.1612 10.5695Z" fill={fill} /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={2} trigger={animationTrigger} originX={66.5} originY={16.5}><Path d="M60.4049 26.3415H51.866L62.466 16.5622L51.866 6.78293H60.4049L66.6209 13.0719L72.837 6.78293H81.3759L70.7759 16.5622L81.3759 26.3415H72.837L66.6209 20.0524L60.4049 26.3415Z" fill={fill} /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={3} trigger={animationTrigger} originX={86} originY={13.5}><Path d="M82.6858 26.3415V0H89V26.3415H82.6858Z" fill={fill} /></AnimatedSvgPart></G></Svg>)
}
