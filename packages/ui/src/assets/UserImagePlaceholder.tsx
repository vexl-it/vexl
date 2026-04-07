import React from 'react'
import Svg, {Circle, ClipPath, Defs, Path, Rect} from 'react-native-svg'
import {useTheme} from 'tamagui'

interface Props {
  readonly size?: number
}

export function UserImagePlaceholder({size = 36}: Props): React.JSX.Element {
  const theme = useTheme()

  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Defs>
        <ClipPath id="leftHalf">
          <Rect width={18} height={36} />
        </ClipPath>
        <ClipPath id="rightHalf">
          <Rect width={18} height={36} transform="translate(18, 0)" />
        </ClipPath>
      </Defs>
      <Rect width={36} height={36} rx={8} fill={theme.backgroundTertiary.val} />
      <Circle cx={18} cy={13} r={5} fill="#455749" clipPath="url(#leftHalf)" />
      <Circle cx={18} cy={13} r={5} fill="#ACD9B7" clipPath="url(#rightHalf)" />
      <Path
        d="M 10 30 A 8 10 0 0 1 26 30 Z"
        fill="#455749"
        clipPath="url(#leftHalf)"
      />
      <Path
        d="M 10 30 A 8 10 0 0 1 26 30 Z"
        fill="#ACD9B7"
        clipPath="url(#rightHalf)"
      />
    </Svg>
  )
}
