import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function Play({
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
        d="M 18.1841 10.7409 C 18.613 11.0184 18.8688 11.4894 18.8688 12.0001 C 18.8688 12.5108 18.6126 12.9818 18.1841 13.2593 L 7.5658 20.1304 C 7.3187 20.2906 7.0352 20.3712 6.751 20.3712 C 6.505 20.3712 6.2587 20.3104 6.0341 20.1886 C 5.5512 19.9257 5.2512 19.4209 5.2512 18.8713 V 5.1289 C 5.2512 4.5792 5.5512 4.0741 6.0341 3.8116 C 6.5174 3.5484 7.1042 3.5709 7.5658 3.8697 L 18.1841 10.7409 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
