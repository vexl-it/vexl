import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function ArrowRight({
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
        d="M 14.0809 18.3599 C 14.2729 18.3568 14.4631 18.281 14.6069 18.1321 L 20.04 12.5218 C 20.3216 12.2312 20.3216 11.7694 20.04 11.4788 L 14.6069 5.8685 C 14.4599 5.7166 14.2642 5.64 14.0685 5.64 C 13.8806 5.64 13.6921 5.7107 13.5462 5.8517 C 13.2488 6.1397 13.2409 6.6148 13.5293 6.9122 L 17.7303 11.2503 L 4.4989 11.2503 C 4.0848 11.2503 3.7488 11.5863 3.7488 12.0003 C 3.7488 12.4143 4.0848 12.7503 4.4989 12.7503 L 17.7303 12.7503 L 13.5293 17.0884 C 13.2413 17.3858 13.2488 17.8606 13.5462 18.1489 C 13.6951 18.2929 13.889 18.363 14.0809 18.3599 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
