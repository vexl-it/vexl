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

export function FullscreenWarningYellowGraphic({
  width = 174,
  height = 174,
  animate = false,
  disableReplayOnPress = false,
}: Props): React.JSX.Element {
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const retriggerAnimation = useCallback(() => {
    if (animate) setAnimationTrigger((current) => current + 1)
  }, [animate])

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 174 174"
      fill="none"
      onPress={
        animate && !disableReplayOnPress ? retriggerAnimation : undefined
      }
    >
      <G>
        <AnimatedSvgPart
          animate={animate}
          index={0}
          trigger={animationTrigger}
          originX={136}
          originY={79}
        >
          <Path
            d="M174 41.2885L115.609 99.6796L115.609 41.2884L174 41.2885Z"
            fill="#FCCD6C"
            fillOpacity={0.9}
          />
          <Path
            d="M99.0931 116.195L157.484 57.8041L157.484 116.195L99.0931 116.195Z"
            fill="#FCCD6C"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={1}
          trigger={animationTrigger}
          originX={38}
          originY={95}
        >
          <Path
            d="M0.00012207 132.711L58.3913 74.3198L58.3913 132.711L0.00012207 132.711Z"
            fill="#FCCD6C"
            fillOpacity={0.9}
          />
          <Path
            d="M74.9069 57.8043L16.5157 116.195L16.5157 57.8042L74.9069 57.8043Z"
            fill="#FCCD6C"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={2}
          trigger={animationTrigger}
          originX={78}
          originY={38}
        >
          <Path
            d="M41.2888 0.00012207L99.68 58.3913L41.2888 58.3913L41.2888 0.00012207Z"
            fill="#FCCD6C"
            fillOpacity={0.9}
          />
          <Path
            d="M116.195 74.9069L57.8043 16.5157L116.195 16.5158L116.195 74.9069Z"
            fill="#FCCD6C"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={3}
          trigger={animationTrigger}
          originX={95}
          originY={136}
        >
          <Path
            d="M132.711 174L74.3199 115.609L132.711 115.609L132.711 174Z"
            fill="#FCCD6C"
            fillOpacity={0.9}
          />
          <Path
            d="M57.8044 99.0931L116.196 157.484L57.8044 157.484L57.8044 99.0931Z"
            fill="#FCCD6C"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={4}
          trigger={animationTrigger}
          originX={86}
          originY={88}
        >
          <Path
            d="M84 101.5H88.5V106H84V101.5ZM84.25 86V71H88.25V86L87.75 98H84.75L84.25 86Z"
            fill="#FCCD6C"
          />
        </AnimatedSvgPart>
      </G>
    </Svg>
  )
}
