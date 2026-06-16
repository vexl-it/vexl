import React from 'react'
import Svg, {
  Circle,
  ClipPath,
  Defs,
  FeColorMatrix,
  Filter,
  G,
  Path,
  Rect,
} from 'react-native-svg'
import {useTheme} from 'tamagui'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
  readonly borderRadius?: number
}

export function UserImagePlaceholder({
  size = 36,
  grayscale = false,
  borderRadius = 8,
}: Props): React.JSX.Element {
  const theme = useTheme()
  const scaledBorderRadius = (borderRadius * 36) / size

  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Defs>
        <ClipPath id="leftHalf">
          <Rect width={18} height={36} />
        </ClipPath>
        <ClipPath id="rightHalf">
          <Rect width={18} height={36} transform="translate(18, 0)" />
        </ClipPath>
        {grayscale ? (
          <Filter id="userImagePlaceholderGrayscale">
            <FeColorMatrix type="saturate" values="0" />
          </Filter>
        ) : null}
      </Defs>
      <G filter={grayscale ? 'url(#userImagePlaceholderGrayscale)' : undefined}>
        <Rect
          width={36}
          height={36}
          rx={scaledBorderRadius}
          fill={theme.backgroundTertiary.get()}
        />
        <Circle
          cx={18}
          cy={13}
          r={5}
          fill="#455749"
          clipPath="url(#leftHalf)"
        />
        <Circle
          cx={18}
          cy={13}
          r={5}
          fill="#ACD9B7"
          clipPath="url(#rightHalf)"
        />
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
      </G>
    </Svg>
  )
}
