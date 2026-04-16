import React from 'react'
import Svg, {Path, Rect} from 'react-native-svg'

import type {IconProps} from './types'

export function CellPhoneDisabled({
  size = 24,
  color = '#000',
  ...rest
}: IconProps): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      color={color}
      {...rest}
    >
      <Path
        d="M11 3.5C9.3455 3.5 8 4.8455 8 6.5V25.5C8 27.1545 9.3455 28.5 11 28.5H21C22.6545 28.5 24 27.1545 24 25.5V6.5C24 4.8455 22.6545 3.5 21 3.5H20H12H11ZM11 5.5H12C12 6.6045 12.8955 7.5 14 7.5H18C19.1045 7.5 20 6.6045 20 5.5H21C21.5515 5.5 22 5.9485 22 6.5V25.5C22 26.0515 21.5515 26.5 21 26.5H11C10.4485 26.5 10 26.0515 10 25.5V6.5C10 5.9485 10.4485 5.5 11 5.5Z"
        fill="currentColor"
      />
      <Rect
        width={29.2945}
        height={2.66667}
        rx={1.33333}
        transform="translate(4 25.4377) rotate(-39.8495)"
        fill="currentColor"
      />
    </Svg>
  )
}
