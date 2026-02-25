import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function CellPhoneMobileDevice({
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
        d="M 8.25 2.6256 C 7.0091 2.6256 6 3.6347 6 4.8755 V 19.1245 C 6 20.3654 7.0091 21.3744 8.25 21.3744 H 15.75 C 16.9909 21.3744 18 20.3654 18 19.1245 V 4.8755 C 18 3.6347 16.9909 2.6256 15.75 2.6256 H 15 H 9 H 8.25 Z M 8.25 4.1255 H 9 C 9 4.9538 9.6716 5.6254 10.5 5.6254 H 13.5 C 14.3284 5.6254 15 4.9538 15 4.1255 H 15.75 C 16.1636 4.1255 16.5 4.4619 16.5 4.8755 V 19.1245 C 16.5 19.5381 16.1636 19.8745 15.75 19.8745 H 8.25 C 7.8364 19.8745 7.5 19.5381 7.5 19.1245 V 4.8755 C 7.5 4.4619 7.8364 4.1255 8.25 4.1255 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
