import {Avatar} from '@vexl-next/ui'
import {AvatarBasic12} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic12'
import {AvatarBasic3} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic3'
import {AvatarBasic5} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic5'
import {AvatarBasic7} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic7'
import {AvatarBasic9} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic9'
import React from 'react'

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
