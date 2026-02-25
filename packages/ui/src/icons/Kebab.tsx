import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function Kebab({
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
        d="M 12 16.8 C 13.0589 16.8 13.92 17.6611 13.92 18.72 C 13.92 19.7789 13.0589 20.64 12 20.64 C 10.9411 20.64 10.08 19.7789 10.08 18.72 C 10.08 17.6611 10.9411 16.8 12 16.8 Z M 12 10.08 C 13.0589 10.08 13.92 10.9411 13.92 12 C 13.92 13.0589 13.0589 13.92 12 13.92 C 10.9411 13.92 10.08 13.0589 10.08 12 C 10.08 10.9411 10.9411 10.08 12 10.08 Z M 12 3.36 C 13.0589 3.36 13.92 4.2211 13.92 5.28 C 13.92 6.3389 13.0589 7.2 12 7.2 C 10.9411 7.2 10.08 6.3389 10.08 5.28 C 10.08 4.2211 10.9411 3.36 12 3.36 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
