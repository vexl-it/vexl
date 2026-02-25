import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function ChevronUp({
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
        d="M 5.7329 13.9185 C 5.4169 14.2794 5.4246 14.8088 5.7495 15.1614 L 5.8237 15.2347 L 5.8999 15.2952 C 6.2917 15.5773 6.8512 15.5517 7.2122 15.2181 L 11.994 10.7962 L 16.7875 15.2278 L 16.8617 15.2903 C 17.2473 15.5832 17.8079 15.5682 18.176 15.2444 C 18.3834 15.0619 18.4992 14.8061 18.4992 14.5405 C 18.4991 14.2833 18.3913 14.035 18.1945 13.8531 L 12.698 8.7722 C 12.5051 8.5937 12.2504 8.501 11.995 8.5008 C 11.7389 8.5008 11.4838 8.5942 11.2909 8.7722 L 5.8052 13.8434 L 5.7329 13.9185 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
