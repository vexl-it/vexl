import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function Send({
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
        d="M 19.441 3.751 C 19.3695 3.7566 19.2978 3.7727 19.2287 3.7994 L 3.4798 9.8848 C 3.1948 9.995 3.005 10.2677 3.0001 10.5733 C 2.9956 10.8793 3.1777 11.1572 3.4593 11.2757 L 9.9781 14.021 L 12.7223 20.5408 C 12.84 20.8194 13.1122 21.0001 13.4137 21.0001 H 13.4254 C 13.7309 20.9956 14.0028 20.8057 14.1131 20.5203 L 20.1983 4.7692 C 20.3052 4.492 20.2392 4.1786 20.0292 3.9686 C 19.8717 3.8108 19.6558 3.7344 19.441 3.751 Z M 18.1887 5.8093 L 13.3837 18.2459 L 11.7885 14.4561 L 15.238 9.2812 C 15.4652 8.9399 15.0582 8.5339 14.7173 8.7612 L 9.5438 12.2111 L 5.7538 10.6143 L 18.1887 5.8093 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
