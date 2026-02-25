import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function SearchMagnifyGlass({
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
        d="M 10.1248 3.3744 C 6.4027 3.3744 3.3744 6.4027 3.3744 10.1248 C 3.3744 13.847 6.4027 16.8753 10.1248 16.8753 C 11.6734 16.8753 13.0974 16.3455 14.2376 15.4653 L 19.1437 20.3713 C 19.4827 20.7103 20.0323 20.7103 20.3713 20.3713 C 20.7103 20.0323 20.7103 19.4827 20.3713 19.1437 L 15.4653 14.2376 C 16.3455 13.0974 16.8753 11.6734 16.8753 10.1248 C 16.8753 6.4027 13.847 3.3744 10.1248 3.3744 Z M 10.1248 4.8745 C 13.0196 4.8745 15.3752 7.23 15.3752 10.1248 C 15.3752 13.0196 13.0196 15.3752 10.1248 15.3752 C 7.23 15.3752 4.8745 13.0196 4.8745 10.1248 C 4.8745 7.23 7.23 4.8745 10.1248 4.8745 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
