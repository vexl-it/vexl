import React from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import {styled} from 'tamagui'

import {UserImagePlaceholder} from '../assets/UserImagePlaceholder'
import {XStack} from '../primitives'
import {Avatar} from './Avatar'
import {Typography} from './Typography'

export interface ChipProps {
  readonly name: string
  readonly trusted?: boolean
  readonly avatarSource?: RNImageProps['source']
}

const AVATAR_SIZE = 16

const ChipFrame = styled(XStack, {
  name: 'Chip',
  backgroundColor: '$backgroundTertiary',
  borderRadius: '$2',
  padding: '$2',
  gap: '$2',
  alignItems: 'center',
  alignSelf: 'flex-start',
  variants: {
    trusted: (
      trusted: boolean
    ): Pick<
      React.ComponentProps<typeof XStack>,
      'backgroundColor' | 'overflow'
    > => ({
      backgroundColor: trusted
        ? '$accentYellowSecondary'
        : '$backgroundTertiary',
      overflow: trusted ? 'visible' : 'hidden',
    }),
  },
  flexShrink: 0,
})

export function Chip({
  name,
  avatarSource,
  trusted = false,
}: ChipProps): React.JSX.Element {
  return (
    <ChipFrame trusted={trusted}>
      <Avatar
        source={avatarSource}
        customSize={AVATAR_SIZE}
        trusted={trusted}
        trustBadgeRingColor="$accentYellowSecondary"
      >
        <UserImagePlaceholder size={AVATAR_SIZE} />
      </Avatar>
      <Typography
        variant="micro"
        color={trusted ? '$foregroundPrimary' : '$foregroundSecondary'}
        numberOfLines={1}
      >
        {name}
      </Typography>
    </ChipFrame>
  )
}
