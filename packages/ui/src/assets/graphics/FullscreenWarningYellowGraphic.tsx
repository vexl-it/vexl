import React, {useCallback, useState} from 'react'
import Svg, {G, Path} from 'react-native-svg'

import {AnimatedSvgPart} from './AnimatedSvgPart'

interface Props {
  readonly variant?: 'dark' | 'light'
  readonly width?: number
  readonly height?: number
  readonly animate?: boolean
  readonly disableReplayOnPress?: boolean
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
