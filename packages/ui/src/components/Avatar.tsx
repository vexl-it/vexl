import React from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import {FilterImage} from 'react-native-svg/filter-image'
import {getTokens} from 'tamagui'
import {Stack, ZStack} from '../primitives'

export type AvatarSize = 'small' | 'medium' | 'large' | '$9'

type SizeToken = keyof ReturnType<typeof getTokens>['size']
export type AvatarCustomSize = number | SizeToken

const SIZE_TOKEN_MAP: Record<AvatarSize, SizeToken> = {
  small: '$8', // 32px
  $9: '$9', // 40px
  medium: '$10', // 48px
  large: '$12', // 64px
}

const GRAYSCALE_FILTER = [
  {name: 'feColorMatrix', type: 'saturate', values: 0} as const,
]

function resolveCustomSizePx(customSize: AvatarCustomSize): number {
  if (typeof customSize === 'number') return customSize

  return getTokens().size[customSize].val
}

export function resolveSizePx(
  size: AvatarSize,
  customSize?: AvatarCustomSize
): number {
  if (customSize != null) return resolveCustomSizePx(customSize)
  return getTokens().size[SIZE_TOKEN_MAP[size]].val
}

export interface AvatarProps {
  readonly source?: RNImageProps['source']
  readonly children?: React.ReactNode
  readonly size?: AvatarSize
  readonly customSize?: AvatarCustomSize
  readonly grayscale?: boolean
}

export function Avatar({
  source,
  children,
  size = 'medium',
  customSize,
  grayscale = false,
}: AvatarProps): React.JSX.Element {
  const dimension = customSize ?? SIZE_TOKEN_MAP[size]
  const backgroundColor = grayscale ? '$black100' : '$backgroundSecondary'

  if (source != null) {
    const px = resolveSizePx(size, customSize)

    return (
      <Stack
        width={px}
        height={px}
        borderRadius="$2.5"
        backgroundColor={backgroundColor}
        overflow="hidden"
      >
        <FilterImage
          source={source}
          style={{width: px, height: px}}
          resizeMode="cover"
          filters={grayscale ? GRAYSCALE_FILTER : undefined}
        />
      </Stack>
    )
  }

  return (
    <ZStack
      width={dimension}
      height={dimension}
      borderRadius="$2.5"
      overflow="hidden"
      backgroundColor={backgroundColor}
    >
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        alignItems="center"
        justifyContent="center"
        opacity={grayscale ? 0.5 : 1}
      >
        {children}
      </Stack>
    </ZStack>
  )
}
