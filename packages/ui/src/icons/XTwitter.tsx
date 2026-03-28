import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function XTwitter({
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
        d="M 4.5336 4.9992 L 10.0527 12.8872 L 4.8238 19.0008 H 6.8777 L 10.9718 14.2014 L 14.3292 19.0008 H 19.704 L 13.9312 10.736 L 18.8244 4.9992 H 16.8024 L 13.0151 9.4233 L 9.9251 4.9992 H 4.5336 Z M 7.5203 6.5549 H 9.1139 L 16.7189 17.445 H 15.1389 L 7.5203 6.5549 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
