import React from 'react'
import Svg, {Circle, Path} from 'react-native-svg'

import type {IconProps} from './types'

export function ImagePhoto({
  size = 24,
  color = '#000',
  ...rest
}: IconProps): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
      {...rest}
    >
      <Path
        d="M 6.375 4.5 H 17.625 C 19.0747 4.5 20.25 5.6753 20.25 7.125 V 16.875 C 20.25 18.3247 19.0747 19.5 17.625 19.5 H 6.375 C 4.9253 19.5 3.75 18.3247 3.75 16.875 V 7.125 C 3.75 5.6753 4.9253 4.5 6.375 4.5 Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 3.75 16.5 L 8.4697 11.7803 C 8.7626 11.4874 9.2374 11.4874 9.5303 11.7803 L 17.25 19.5 M 13.125 15.375 L 14.8447 13.6553 C 15.1376 13.3624 15.6124 13.3624 15.9053 13.6553 L 19.875 17.625"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={15.375}
        cy={8.625}
        r={1.125}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </Svg>
  )
}
