import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function FileImport({
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
        d="M 12.75 3.75 H 8.25 C 7.0074 3.75 6 4.7574 6 6 V 18 C 6 19.2426 7.0074 20.25 8.25 20.25 H 15.75 C 16.9926 20.25 18 19.2426 18 18 V 9 L 12.75 3.75 Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 12.75 3.75 V 6.75 C 12.75 7.9926 13.7574 9 15 9 H 18"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 12 17.25 V 11.25 M 9.75 13.5 L 12 11.25 L 14.25 13.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
