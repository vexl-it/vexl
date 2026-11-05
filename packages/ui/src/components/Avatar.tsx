import React, {useId} from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import Svg, {
  FeColorMatrix,
  Filter,
  Image as SvgImage,
  SvgXml,
} from 'react-native-svg'
import {getTokens, type ColorTokens} from 'tamagui'
import {Stack} from '../primitives'
import {TrustBadge} from './TrustBadge'

type SizeToken = keyof ReturnType<typeof getTokens>['size']
type NamedAvatarSize = 'small' | 'medium' | 'large'

export type AvatarSize = NamedAvatarSize | SizeToken
export type AvatarCustomSize = number | SizeToken

const NAMED_SIZE_TOKENS: Record<NamedAvatarSize, SizeToken> = {
  small: '$8', // 32px
  medium: '$10', // 48px
  large: '$12', // 64px
}

function resolveSizeToken(size: AvatarSize): SizeToken {
  if (size === 'small' || size === 'medium' || size === 'large')
    return NAMED_SIZE_TOKENS[size]
  return size
}

export function resolveSizePx(
  size: AvatarSize,
  customSize?: AvatarCustomSize
): number {
  if (typeof customSize === 'number') return customSize
  return getTokens().size[customSize ?? resolveSizeToken(size)].val
}

// SvgXml renders an opaque string, so the grayscale filter has to be injected into the markup itself.
function grayscaleSvgXml(xml: string): string {
  const svgOpeningTag = /<svg[^>]*>/.exec(xml)?.[0]
  if (!svgOpeningTag) return xml

  const content = xml.replace(svgOpeningTag, '').replace('</svg>', '')
  return `${svgOpeningTag}<filter id="avatarGrayscale"><feColorMatrix type="saturate" values="0"/></filter><g filter="url(#avatarGrayscale)">${content}</g></svg>`
}

export interface AvatarProps {
  readonly source?: RNImageProps['source']
  readonly svgXml?: string
  readonly children?: React.ReactNode
  readonly size?: AvatarSize
  readonly customSize?: AvatarCustomSize
  readonly grayscale?: boolean
  readonly trusted?: boolean
  readonly trustBadgeRingColor?: ColorTokens
}

function AvatarContent({
  source,
  svgXml,
  children,
  px,
  grayscale,
}: {
  readonly source?: RNImageProps['source']
  readonly svgXml?: string
  readonly children?: React.ReactNode
  readonly px: number
  readonly grayscale: boolean
}): React.JSX.Element {
  const filterId = useId()

  if (source != null)
    return (
      <Svg width={px} height={px}>
        {grayscale ? (
          <Filter id={filterId}>
            <FeColorMatrix type="saturate" values={0} />
          </Filter>
        ) : null}
        <SvgImage
          href={source}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          filter={grayscale ? `url(#${filterId})` : undefined}
        />
      </Svg>
    )

  if (svgXml != null)
    return (
      <SvgXml
        width={px}
        height={px}
        xml={grayscale ? grayscaleSvgXml(svgXml) : svgXml}
      />
    )

  return (
    <Stack
      width={px}
      height={px}
      alignItems="center"
      justifyContent="center"
      opacity={grayscale ? 0.5 : 1}
    >
      {children}
    </Stack>
  )
}

export function Avatar({
  source,
  svgXml,
  children,
  size = 'medium',
  customSize,
  grayscale = false,
  trusted = false,
  trustBadgeRingColor = '$backgroundSecondary',
}: AvatarProps): React.JSX.Element {
  const px = resolveSizePx(size, customSize)

  const avatar = (
    <Stack
      width={px}
      height={px}
      borderRadius="$2.5"
      overflow="hidden"
      backgroundColor={grayscale ? '$black100' : '$backgroundSecondary'}
    >
      <AvatarContent
        source={source}
        svgXml={svgXml}
        px={px}
        grayscale={grayscale}
      >
        {children}
      </AvatarContent>
    </Stack>
  )

  if (!trusted) return avatar

  const {size: sizes} = getTokens()
  const largeBadge = px >= sizes.$8.val
  const badgeOffset =
    -(0.3 * (largeBadge ? sizes.$5.val : sizes['$3.5'].val)) - sizes.$1.val

  return (
    <Stack position="relative" width={px} height={px}>
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
