import React from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import {FilterImage} from 'react-native-svg/filter-image'
import {getTokens, type ColorTokens} from 'tamagui'
import {Stack, ZStack} from '../primitives'
import {TrustBadge} from './TrustBadge'

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
  readonly trusted?: boolean
  readonly trustBadgeRingColor?: ColorTokens
}

export function Avatar({
  source,
  children,
  size = 'medium',
  customSize,
  grayscale = false,
  trusted = false,
  trustBadgeRingColor = '$backgroundSecondary',
}: AvatarProps): React.JSX.Element {
  const dimension = customSize ?? SIZE_TOKEN_MAP[size]
  const backgroundColor = grayscale ? '$black100' : '$backgroundSecondary'

  const px = resolveSizePx(size, customSize)
  const avatar =
    source != null ? (
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
    ) : (
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

  if (!trusted) return avatar

  const largeBadge = px >= 32
  const badgeOffset = -(0.3 * (largeBadge ? getTokens().size.$5.val : 10)) - 2

  return (
    <Stack position="relative" width={dimension} height={dimension}>
      {avatar}
      <Stack position="absolute" bottom={badgeOffset} right={badgeOffset}>
        <TrustBadge
          size={largeBadge ? 'large' : 'small'}
          ringColor={trustBadgeRingColor}
        />
      </Stack>
    </Stack>
  )
}
