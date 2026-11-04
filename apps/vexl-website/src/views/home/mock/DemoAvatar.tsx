import {Avatar, Typography, YStack} from '@vexl-next/ui'
import {AvatarBasic12} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic12'
import {AvatarBasic3} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic3'
import {AvatarBasic5} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic5'
import {AvatarBasic7} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic7'
import {AvatarBasic9} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic9'
import React from 'react'
import {type ColorTokens} from 'tamagui'

// Imported one by one: the full avatar list would ship ~60 SVG components
const avatarSvgs = [
  AvatarBasic3,
  AvatarBasic7,
  AvatarBasic12,
  AvatarBasic5,
  AvatarBasic9,
] as const

export type DemoAvatarIndex = 0 | 1 | 2 | 3 | 4

export function DemoAvatar({
  index,
  size,
}: {
  readonly index: DemoAvatarIndex
  readonly size: number
}): React.JSX.Element {
  const Svg = avatarSvgs[index]
  return (
    <Avatar size="small" customSize={size}>
      <Svg size={size} />
    </Avatar>
  )
}

/** Stands in for the real photo someone shares when they reveal themselves. */
export function RevealedAvatar({
  name,
  size,
  backgroundColor,
}: {
  readonly name: string
  readonly size: number
  readonly backgroundColor: ColorTokens
}): React.JSX.Element {
  return (
    <Avatar size="small" customSize={size}>
      <YStack
        width={size}
        height={size}
        alignItems="center"
        justifyContent="center"
        backgroundColor={backgroundColor}
      >
        <Typography
          variant={size > 48 ? 'heading2' : 'titlesSmall'}
          color="$foregroundPrimary"
        >
          {name.charAt(0)}
        </Typography>
      </YStack>
    </Avatar>
  )
}
