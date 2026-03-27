import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function ChevronLeft({
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
        d="M 12.9196 5.7329 C 13.2805 5.4169 13.8102 5.4246 14.1629 5.7495 L 14.2362 5.8237 L 14.2967 5.8999 C 14.5789 6.2917 14.5533 6.8512 14.2196 7.2122 L 9.7962 11.994 L 14.2293 16.7875 L 14.2918 16.8617 C 14.5848 17.2473 14.5699 17.8079 14.2459 18.176 C 14.0633 18.3834 13.8074 18.4992 13.5418 18.4992 C 13.2845 18.4991 13.036 18.3913 12.8542 18.1945 L 7.7715 12.698 C 7.5929 12.5051 7.5002 12.2504 7.5 11.995 C 7.5 11.7389 7.5934 11.4838 7.7715 11.2909 L 12.8444 5.8052 L 12.9196 5.7329 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
