import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function More({
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
        d="M 12 16.8 C 16.765 16.8 20.64 17.6611 20.64 18.72 C 20.64 19.7789 16.765 20.64 12 20.64 C 7.235 20.64 3.36 19.7789 3.36 18.72 C 3.36 17.6611 7.235 16.8 12 16.8 Z M 12 10.08 C 16.765 10.08 20.64 10.9411 20.64 12 C 20.64 13.0589 16.765 13.92 12 13.92 C 7.235 13.92 3.36 13.0589 3.36 12 C 3.36 10.9411 7.235 10.08 12 10.08 Z M 12 3.36 C 16.765 3.36 20.64 4.2211 20.64 5.28 C 20.64 6.3389 16.765 7.2 12 7.2 C 7.235 7.2 3.36 6.3389 3.36 5.28 C 3.36 4.2211 7.235 3.36 12 3.36 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
