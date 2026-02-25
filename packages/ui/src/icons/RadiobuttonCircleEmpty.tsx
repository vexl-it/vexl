import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function RadiobuttonCircleEmpty({
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
        d="M 12 20.6256 C 7.2436 20.6256 3.3744 16.7561 3.3744 12 C 3.3744 7.2439 7.2436 3.3744 12 3.3744 C 16.7564 3.3744 20.6256 7.2439 20.6256 12 C 20.6256 16.7561 16.7564 20.6256 12 20.6256 Z M 12 5.2495 C 8.2779 5.2495 5.2495 8.2779 5.2495 12 C 5.2495 15.7222 8.2779 18.7505 12 18.7505 C 15.7222 18.7505 18.7505 15.7222 18.7505 12 C 18.7505 8.2779 15.7222 5.2495 12 5.2495 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
