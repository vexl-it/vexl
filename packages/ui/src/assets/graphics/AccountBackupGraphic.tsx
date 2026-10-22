import React, {useCallback, useState} from 'react'
import Svg, {Circle, G, Path, Rect} from 'react-native-svg'

import {AnimatedSvgPart} from './AnimatedSvgPart'

interface Props {
  readonly width?: number
  readonly height?: number
  readonly animate?: boolean
  readonly disableReplayOnPress?: boolean
}

export function AccountBackupGraphic({
  width = 184,
  height = 214,
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
      viewBox="0 0 184 214"
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
          originX={94}
          originY={103}
        >
          <Path
            d="M16 32A26 26 0 0 1 42 6H138L172 40V174A26 26 0 0 1 146 200H16Z"
            fill="#EDF8F0"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={1}
          trigger={animationTrigger}
          originX={155}
          originY={23}
        >
          <Path d="M138 6V40H172Z" fill="#ACD9B7" />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={2}
          trigger={animationTrigger}
          originX={94}
          originY={59}
        >
          <Path d="M94 46A26 26 0 0 0 68 72H94Z" fill="#3D4D41" />
          <Path d="M94 46A26 26 0 0 1 120 72H94Z" fill="#ACD9B7" />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={3}
          trigger={animationTrigger}
          originX={94}
          originY={104}
        >
          <Path d="M94 72L128 106H94Z" fill="#F8C471" />
          <Path d="M60 102H94V136Z" fill="#3D4D41" />
          <Rect
            width="72"
            height="4.4"
            fill="black"
            transform="translate(58, 85.8)"
          />
          <Path d="M67.81 78.81A13 13 0 0 0 86.19 97.19Z" fill="black" />
          <Path d="M67.81 78.81A13 13 0 0 1 86.19 97.19Z" fill="#333333" />
          <Path d="M101.81 78.81A13 13 0 0 0 120.19 97.19Z" fill="black" />
          <Path d="M101.81 78.81A13 13 0 0 1 120.19 97.19Z" fill="#333333" />
          <Path d="M94 116L116 116L94 138Z" fill="#FCC5F3" />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={4}
          trigger={animationTrigger}
          originX={56}
          originY={180}
        >
          <Path
            d="M40 154A16 16 0 0 1 72 154V166H64V154A8 8 0 0 0 48 154V166H40Z"
            fill="#3D4D41"
          />
          <Path
            d="M28 164H84V188A24 24 0 0 1 60 212H52A24 24 0 0 1 28 188Z"
            fill="#FCCD6C"
          />
          <Path
            d="M84 164V188A24 24 0 0 1 60 212H52A24 24 0 0 1 36.4 206.2L84 164Z"
            fill="#EEB338"
          />
          <Circle cx="56" cy="183" r="6" fill="black" />
          <Rect
            width="5"
            height="12"
            rx="2.5"
            fill="black"
            transform="translate(53.5, 186)"
          />
        </AnimatedSvgPart>
        <AnimatedSvgPart
          animate={animate}
          index={5}
          trigger={animationTrigger}
          originX={172}
          originY={138}
        >
          <Path d="M172 126A12 12 0 0 1 172 150Z" fill="#FCC5F3" />
          <Path d="M172 126A12 12 0 0 0 172 150Z" fill="#FBA5EC" />
        </AnimatedSvgPart>
      </G>
    </Svg>
  )
}
