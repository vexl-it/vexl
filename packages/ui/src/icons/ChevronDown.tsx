import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function ChevronDown({
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
        d="M 5.7329 10.0815 C 5.4169 9.7206 5.4246 9.1912 5.7495 8.8386 L 5.8237 8.7653 L 5.8999 8.7048 C 6.2917 8.4227 6.8512 8.4483 7.2122 8.7819 L 11.994 13.2038 L 16.7875 8.7722 L 16.8617 8.7097 C 17.2473 8.4168 17.8079 8.4317 18.176 8.7556 C 18.3834 8.9381 18.4992 9.1939 18.4992 9.4595 C 18.4991 9.7167 18.3913 9.965 18.1945 10.1469 L 12.698 15.2278 C 12.5051 15.4063 12.2504 15.499 11.995 15.4992 C 11.7389 15.4992 11.4838 15.4058 11.2909 15.2278 L 5.8052 10.1566 L 5.7329 10.0815 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
