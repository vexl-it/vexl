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
        d="M 14.9188 5.7329 C 15.2797 5.4169 15.8094 5.4246 16.1621 5.7495 L 16.2354 5.8237 L 16.2959 5.8999 C 16.5781 6.2917 16.5525 6.8512 16.2188 7.2122 L 11.7954 11.994 L 16.2285 16.7875 L 16.291 16.8617 C 16.584 17.2473 16.5691 17.8079 16.2451 18.176 C 16.0625 18.3834 15.8066 18.4992 15.541 18.4992 C 15.2837 18.4991 15.0352 18.3913 14.8534 18.1945 L 9.7707 12.698 C 9.5921 12.5051 9.4994 12.2504 9.4992 11.995 C 9.4992 11.7389 9.5926 11.4838 9.7707 11.2909 L 14.8436 5.8052 L 14.9188 5.7329 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
