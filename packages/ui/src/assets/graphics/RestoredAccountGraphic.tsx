import React, {useCallback, useState} from 'react'
import Svg, {Circle, G, Path, Rect} from 'react-native-svg'

import {AnimatedSvgPart} from './AnimatedSvgPart'

interface Props {
  readonly width?: number
  readonly height?: number
  readonly animate?: boolean
  readonly disableReplayOnPress?: boolean
}

export function RestoredAccountGraphic({
  width = 200,
  height = 204,
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
      viewBox="0 0 200 204"
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
          originX={100}
          originY={102}
        >
          <Rect
            width="110"
            height="196"
            rx="24"
            fill="#EDF8F0"
            transform="translate(45, 4)"
          />
          <Rect
            width="36"
            height="7"
            rx="3.5"
            fill="#3D4D41"
            transform="translate(82, 14)"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={1}
          trigger={animationTrigger}
          originX={18}
          originY={186}
        >
          <Path d="M0 204L36 168V204Z" fill="#ACD9B7" />
          <Path d="M36 168L0 204V168Z" fill="#88C797" />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={2}
          trigger={animationTrigger}
          originX={184}
          originY={18}
        >
          <Path
            d="M200 34C191 34 168 34 168 34C168 25 175 18 184 18H200Z"
            fill="#FBA5EC"
          />
          <Path
            d="M168 2C177 2 200 2 200 2C200 11 193 18 184 18H168Z"
            fill="#FCC5F3"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={3}
          trigger={animationTrigger}
          originX={26}
          originY={98}
        >
          <Path d="M26 76A22 22 0 0 0 26 120Z" fill="#FCCD6C" />
          <Path d="M26 76A22 22 0 0 1 26 120Z" fill="#EEB338" />
          <Rect
            width="52"
            height="4.4"
            fill="black"
            transform="translate(2, 91.8)"
          />
          <Path d="M10.64 87.64A9 9 0 0 0 23.36 100.36Z" fill="black" />
          <Path d="M10.64 87.64A9 9 0 0 1 23.36 100.36Z" fill="#333333" />
          <Path d="M32.64 87.64A9 9 0 0 0 45.36 100.36Z" fill="black" />
          <Path d="M32.64 87.64A9 9 0 0 1 45.36 100.36Z" fill="#333333" />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={4}
          trigger={animationTrigger}
          originX={58}
          originY={68}
        >
          <Path
            d="M58 54A14 14 0 0 1 72 40H116A14 14 0 0 1 116 68H58Z"
            fill="#ACD9B7"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={5}
          trigger={animationTrigger}
          originX={142}
          originY={104}
        >
          <Path
            d="M88 76H128A14 14 0 0 1 142 90V104H88A14 14 0 0 1 88 76Z"
            fill="#FCC5F3"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={6}
          trigger={animationTrigger}
          originX={58}
          originY={140}
        >
          <Path
            d="M58 126A14 14 0 0 1 72 112H100A14 14 0 0 1 100 140H58Z"
            fill="#FCCD6C"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={7}
          trigger={animationTrigger}
          originX={100}
          originY={151}
        >
          <Rect
            width="84"
            height="2"
            rx="1"
            fill="#88C797"
            transform="translate(58, 150)"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={8}
          trigger={animationTrigger}
          originX={142}
          originY={188}
        >
          <Path
            d="M109 162H129A13 13 0 0 1 142 175V188H109A13 13 0 0 1 109 162Z"
            fill="#3D4D41"
          />
          <Circle cx="110" cy="175" r="3" fill="#EDF8F0" />
          <Circle cx="119" cy="175" r="3" fill="#EDF8F0" />
          <Circle cx="128" cy="175" r="3" fill="#EDF8F0" />
        </AnimatedSvgPart>
      </G>
    </Svg>
  )
}
