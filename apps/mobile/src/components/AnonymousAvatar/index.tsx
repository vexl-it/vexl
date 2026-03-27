import {type GoldenAvatarType} from '@vexl-next/domain/src/general/offers'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  Avatar,
  type AvatarSize,
  resolveSizePx,
  avatarsSvg as uiAvatars,
  avatarsGoldenGlassesAndBackgroundSvg as uiAvatarsGolden,
} from '@vexl-next/ui'
import React from 'react'
import {randomNumberFromSeed} from '../../utils/randomNumber'
import {type RandomSeed} from '../../utils/RandomSeed'

export function AnonymousAvatarOrClubImage({
  seed,
  size = 'medium',
  customSize,
  grayScale,
  goldenAvatarType,
  clubImageUrl,
}: {
  seed: RandomSeed
  size?: AvatarSize
  customSize?: number
  grayScale: boolean
  goldenAvatarType?: GoldenAvatarType
  clubImageUrl?: UriString
}): React.ReactElement {
  if (clubImageUrl) {
    return (
      <Avatar
        size={size}
        customSize={customSize}
        source={{uri: clubImageUrl}}
        grayscale={grayScale}
      />
    )
  }

  const avatars =
    goldenAvatarType === 'BACKGROUND_AND_GLASSES' ? uiAvatarsGolden : uiAvatars

  const index = randomNumberFromSeed(0, avatars.length - 1, seed)
  const AvatarComponent = avatars[index]
  const px = resolveSizePx(size, customSize)

  if (!AvatarComponent) {
    return <Avatar size={size} customSize={customSize} />
  }

  return (
    <Avatar size={size} customSize={customSize}>
      <AvatarComponent size={px} grayscale={grayScale} />
    </Avatar>
  )
}
