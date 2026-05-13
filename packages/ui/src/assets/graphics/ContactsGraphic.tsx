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

export function ContactsGraphic({
  width = 184,
  height = 214,
  animate = false,
}: Props): React.JSX.Element {
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const retriggerAnimation = useCallback(() => {
    if (animate) setAnimationTrigger((current) => current + 1)
  }, [animate])

  // prettier-ignore
  return (<Svg width={width} height={height} viewBox="0 0 184 214" fill="none" onPress={animate ? retriggerAnimation : undefined}><G><AnimatedSvgPart animate={animate} index={0} trigger={animationTrigger} originX={94} originY={103}><Path d="M16.1021 32.9396C16.1021 20.3753 16.1021 14.0931 20.0053 10.1899C23.9085 6.28662 30.1907 6.28662 42.7551 6.28662H171.578V173.423C171.578 185.988 171.578 192.27 167.675 196.173C163.772 200.077 157.49 200.077 144.925 200.077H16.1021V32.9396Z" fill="#EDF8F0" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={1} trigger={animationTrigger} originX={18} originY={195}><Path d="M0 213.556L36.8811 176.675L36.8811 213.556L0 213.556Z" fill="#ACD9B7" /><Path d="M36.8818 176.675L0.000696477 213.556L0.00069809 176.675L36.8818 176.675Z" fill="#88C797" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={2} trigger={animationTrigger} originX={168} originY={15}><Path d="M183.219 30.6355C174.668 30.6355 152.583 30.6355 152.583 30.6355C152.583 22.1758 159.515 15.3178 168.066 15.3178L183.219 15.3177L183.219 30.6355Z" fill="#FBA5EC" /><Path d="M152.583 -2.95639e-05C161.134 -2.94619e-05 183.219 -2.91986e-05 183.219 -2.91986e-05C183.219 8.45974 176.287 15.3177 167.736 15.3177L152.583 15.3177L152.583 -2.95639e-05Z" fill="#FCC5F3" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={3} trigger={animationTrigger} originX={94} originY={100}><Path d="M107.667 114.285L80.0129 86.6305L107.667 86.6305L107.667 114.285Z" fill="#ACD9B7" /><Path d="M80.0127 86.6306L107.667 114.285H80.0127V86.6306Z" fill="#88C797" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={4} trigger={animationTrigger} originX={132} originY={100}><Path d="M145.692 114.285C137.974 114.285 118.038 114.285 118.038 114.285C118.038 106.649 124.295 100.458 132.014 100.458L145.692 100.458L145.692 114.285Z" fill="#FBA5EC" /><Path d="M118.038 86.6306C125.757 86.6306 145.693 86.6306 145.693 86.6306C145.693 94.2672 139.435 100.458 131.717 100.458L118.038 100.458L118.038 86.6306Z" fill="#FCC5F3" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={5} trigger={animationTrigger} originX={56} originY={101}><Path d="M55.8146 114.655C63.4512 114.655 69.6419 108.464 69.6419 100.827L41.9873 100.827C41.9873 108.464 48.178 114.655 55.8146 114.655Z" fill="#FCCD6C" /><Path d="M55.8148 87C48.1782 87 41.9875 93.3314 41.9875 100.827L69.6421 100.827C69.6421 93.3314 63.4514 87 55.8148 87Z" fill="#EEB338" /></AnimatedSvgPart></G></Svg>)
}
