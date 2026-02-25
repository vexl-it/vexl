import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function Checkmark({
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
        d="M 19.3499 4.2461 C 19.6975 4.4714 19.7965 4.9356 19.5715 5.2832 L 10.3381 19.532 C 10.2102 19.7289 9.998 19.8549 9.7636 19.8722 C 9.7448 19.8737 9.7264 19.8744 9.7084 19.8744 C 9.4939 19.8744 9.2884 19.7822 9.1451 19.6198 L 4.4947 14.3354 C 4.2213 14.0241 4.2517 13.5505 4.5626 13.2768 C 4.8735 13.0031 5.3475 13.0338 5.6213 13.3443 L 9.6173 17.8856 L 18.3121 4.4677 C 18.5375 4.1197 19.001 4.0215 19.3499 4.2461 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
