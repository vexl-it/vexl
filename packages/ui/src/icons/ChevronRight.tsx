import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function ChevronRight({
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 11.0804 5.7329 C 10.7195 5.4169 10.1898 5.4246 9.8371 5.7495 L 9.7638 5.8237 L 9.7033 5.8999 C 9.4211 6.2917 9.4467 6.8512 9.7804 7.2122 L 14.2038 11.994 L 9.7707 16.7875 L 9.7082 16.8617 C 9.4152 17.2473 9.4301 17.8079 9.7541 18.176 C 9.9367 18.3834 10.1926 18.4992 10.4582 18.4992 C 10.7155 18.4991 10.964 18.3913 11.1458 18.1945 L 16.2285 12.698 C 16.4071 12.5051 16.4998 12.2504 16.5 11.995 C 16.5 11.7389 16.4066 11.4838 16.2285 11.2909 L 11.1556 5.8052 L 11.0804 5.7329 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
