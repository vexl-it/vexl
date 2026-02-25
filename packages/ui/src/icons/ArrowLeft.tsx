import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function ArrowLeft({
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
        d="M 9.9191 5.6401 C 9.7271 5.6432 9.5369 5.719 9.3931 5.8679 L 3.96 11.4782 C 3.6784 11.7688 3.6784 12.2305 3.96 12.5211 L 9.3931 18.1315 C 9.5401 18.2833 9.7357 18.36 9.9315 18.36 C 10.1194 18.36 10.3079 18.2893 10.4538 18.1483 C 10.7512 17.8603 10.7591 17.3851 10.4706 17.0878 L 6.2697 12.7497 H 19.5011 C 19.9152 12.7497 20.2512 12.4137 20.2512 11.9997 C 20.2512 11.5857 19.9152 11.2497 19.5011 11.2497 H 6.2697 L 10.4706 6.9116 C 10.7587 6.6142 10.7512 6.1394 10.4538 5.851 C 10.3049 5.707 10.111 5.637 9.9191 5.6401 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
