import React from 'react'
import Svg, {Path} from 'react-native-svg'

import type {IconProps} from './types'

export function BubbleTip({
  size = 24,
  color = '#000',
  ...rest
}: IconProps): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 25 10"
      fill="none"
      color={color}
      {...rest}
    >
      <Path
        d="M24.2637 8.65796C24.2637 9.21024 23.816 9.65796 23.2637 9.65796L1 9.65796C0.44772 9.65796 0 9.21024 0 8.65796C0 8.10567 0.44772 7.65796 1.00001 7.65796L1.13209 7.65796C1.55741 7.65796 1.96802 7.50233 2.28649 7.22042L8.72241 1.52341C9.27316 1.03589 9.54853 0.792134 9.81965 0.620465C11.1263 -0.206874 12.7928 -0.206874 14.0994 0.620465C14.3705 0.792134 14.6459 1.03589 15.1966 1.52341L21.5375 7.13628C21.9172 7.4724 22.4068 7.65796 22.9139 7.65796L23.2637 7.65796C23.816 7.65796 24.2637 8.10567 24.2637 8.65796Z"
        fill="currentColor"
      />
    </Svg>
  )
}
