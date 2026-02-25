import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function DuoToneContrastTheme({
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
        d="M 12 3.7512 C 16.5555 3.7512 20.2488 7.4444 20.2488 12 C 20.2488 16.5555 16.5555 20.2488 12 20.2488 C 7.4444 20.2488 3.7512 16.5555 3.7512 12 C 3.7512 7.4444 7.4444 3.7512 12 3.7512 Z M 11.4005 5.2783 C 7.954 5.5818 5.251 8.4747 5.251 12 C 5.251 15.5252 7.9541 18.4173 11.4005 18.7207 V 5.2783 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
