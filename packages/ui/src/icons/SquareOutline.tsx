import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function SquareOutline({
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
        d="M 19.5 8.9149 V 15.0848 C 19.5 19.1794 19.1794 19.5 15.0851 19.5 H 8.9149 C 4.8206 19.5 4.5 19.1794 4.5 15.0851 V 8.9149 C 4.5 4.8202 4.8206 4.5 8.9149 4.5 H 15.0848 C 19.1794 4.5 19.5 4.8202 19.5 8.9149 Z M 18 16.062 V 7.938 C 18 6.1406 17.8594 6 16.062 6 H 7.938 C 6.1406 6 6 6.1406 6 7.938 V 16.0624 C 6 17.8594 6.1406 18 7.938 18 H 16.0624 C 17.8594 18 18 17.8594 18 16.062 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
