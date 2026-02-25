import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function Pause({
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
        d="M 8.6674 4.0008 C 9.4036 4.0008 10.0005 4.5977 10.0005 5.334 V 18.666 C 10.0005 19.4023 9.4036 19.9992 8.6674 19.9992 C 7.9313 19.9992 7.3344 19.4023 7.3344 18.666 V 5.334 C 7.3344 4.5977 7.9313 4.0008 8.6674 4.0008 Z M 15.3326 4.0008 C 16.0687 4.0008 16.6656 4.5977 16.6656 5.334 V 18.666 C 16.6656 19.4023 16.0687 19.9992 15.3326 19.9992 C 14.5964 19.9992 13.9995 19.4023 13.9995 18.666 V 5.334 C 13.9995 4.5977 14.5964 4.0008 15.3326 4.0008 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
