import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function Rejected({
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
        d="M 12.001 4.584 C 16.096 4.5844 19.4159 7.905 19.416 12.0005 C 19.4158 16.0959 16.096 19.4156 12.001 19.416 C 7.9055 19.416 4.5842 16.0962 4.584 12.0005 C 4.5841 7.9048 7.9055 4.584 12.001 4.584 Z M 7.3209 8.3816 C 6.5461 9.3821 6.0848 10.6372 6.0848 12.0005 C 6.0849 15.2678 8.7338 17.9161 12.001 17.9161 C 13.3638 17.9159 14.6175 17.4534 15.6177 16.6789 L 7.3209 8.3816 Z M 12.001 6.0839 C 10.6376 6.0839 9.3819 6.5461 8.3813 7.3211 L 16.6781 15.6185 C 17.4528 14.6181 17.9161 13.3638 17.9162 12.0005 C 17.9161 8.7334 15.2678 6.0843 12.001 6.0839 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
