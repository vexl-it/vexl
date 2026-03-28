import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function PlusAdd({
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
        d="M 12 4.5 C 11.586 4.5 11.25 4.836 11.25 5.25 V 11.25 H 5.25 C 4.836 11.25 4.5 11.586 4.5 12 C 4.5 12.414 4.836 12.75 5.25 12.75 H 11.25 V 18.75 C 11.25 19.164 11.586 19.5 12 19.5 C 12.414 19.5 12.75 19.164 12.75 18.75 V 12.75 H 18.75 C 19.164 12.75 19.5 12.414 19.5 12 C 19.5 11.586 19.164 11.25 18.75 11.25 H 12.75 V 5.25 C 12.75 4.836 12.414 4.5 12 4.5 Z"
        fill="currentColor"
      />
    </Svg>
  )
}
