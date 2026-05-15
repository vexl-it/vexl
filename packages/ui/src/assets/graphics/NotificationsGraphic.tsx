import type {ReactNode} from 'react'
import React, {useCallback, useEffect, useId, useState} from 'react'
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, {ClipPath, Defs, G, Path, Rect} from 'react-native-svg'

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

export function NotificationsGraphic({
  width = 157,
  height = 153,
  animate = false,
  disableReplayOnPress = false,
}: Props): React.JSX.Element {
  const uid = useId()
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const retriggerAnimation = useCallback(() => {
    if (animate) setAnimationTrigger((current) => current + 1)
  }, [animate])

  // prettier-ignore
  return (<Svg width={width} height={height} viewBox="0 0 157 153" fill="none" onPress={animate && !disableReplayOnPress ? retriggerAnimation : undefined}><G><AnimatedSvgPart animate={animate} index={0} trigger={animationTrigger} originX={78} originY={76}><Path d="M0 54.908C0 29.0241 0 16.0822 8.0411 8.0411C16.0822 0 29.0241 0 54.9081 0H156.717V73.1532C156.717 99.037 156.717 111.979 148.676 120.02C140.635 128.061 127.693 128.061 101.809 128.061H78.3584H39.8018C32.5276 128.061 28.8905 128.061 25.6019 129.385C22.3133 130.708 19.6902 133.228 14.4441 138.267L0 152.141V54.908Z" fill="#EDF8F0" /></AnimatedSvgPart><G clipPath={`url(#${uid}-clip0)`}><AnimatedSvgPart animate={animate} index={1} trigger={animationTrigger} originX={82} originY={27}><Path d="M104.396 16.2783C116.756 16.2783 126.776 26.2985 126.776 38.6589L104.283 38.6589C91.9228 38.6589 81.9027 28.6388 81.9027 16.2783L104.396 16.2783Z" fill="#ACD9B7" /><Path d="M59.4094 16.1659C47.049 16.1659 37.0288 26.186 37.0288 38.5465L59.5219 38.5465C71.8824 38.5465 81.9025 28.5264 81.9025 16.1659L59.4094 16.1659Z" fill="#3D4D41" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={2} trigger={animationTrigger} originX={82} originY={72}><Path d="M77.6289 38.6588L126.776 87.8062H77.6289V38.6588Z" fill="#F8C471" /><Path d="M43.7769 83.6451H77.6289V117.385L43.7769 83.6451Z" fill="#3D4D41" /><Path d="M50.9741 55.7797H112.841V60.1596H50.9741V55.7797Z" fill="black" /><Path d="M76.5305 67.6483C76.5305 67.6483 72.1973 63.3151 66.8521 57.9699C61.5068 52.6246 57.1736 48.2915 57.1736 48.2915C62.5189 42.9462 71.1852 42.9462 76.5305 48.2915C81.8757 53.6367 81.8757 62.303 76.5305 67.6483Z" fill="#333333" /><Path d="M76.5306 67.6483C71.1854 72.9936 62.5191 72.9936 57.1738 67.6483C51.8286 62.3031 51.8286 53.6368 57.1738 48.2915C57.1738 48.2915 61.507 52.6247 66.8522 57.9699C72.1975 63.3152 76.5306 67.6483 76.5306 67.6483Z" fill="black" /><Path d="M106.643 67.6485C106.643 67.6485 102.31 63.3153 96.9644 57.9701C91.6191 52.6249 87.2859 48.2917 87.2859 48.2917C92.6312 42.9465 101.298 42.9465 106.643 48.2917C111.988 53.6369 111.988 62.3033 106.643 67.6485Z" fill="#333333" /><Path d="M106.643 67.6485C101.298 72.9937 92.6314 72.9937 87.2861 67.6485C81.9409 62.3032 81.9409 53.6369 87.2861 48.2916C87.2861 48.2916 91.6193 52.6248 96.9645 57.97C102.31 63.3153 106.643 67.6485 106.643 67.6485Z" fill="black" /><Rect width="4.16122" height="0.562327" fill="black" transform="translate(80.5522 59.5776)" /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={3} trigger={animationTrigger} originX={89} originY={106}><Path d="M100.122 94.8915L77.629 117.385L77.629 94.8915L100.122 94.8915Z" fill="#FCC5F3" /></AnimatedSvgPart></G></G><Defs><ClipPath id={`${uid}-clip0`}><Rect width="112.465" height="112.465" fill="white" transform="translate(25.5576 4.91943)" /></ClipPath></Defs></Svg>)
}
