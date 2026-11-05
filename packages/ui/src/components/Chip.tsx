import React from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import {getTokens, styled} from 'tamagui'

import {UserImagePlaceholder} from '../assets/UserImagePlaceholder'
import {XStack} from '../primitives'
import {Avatar} from './Avatar'
import {Typography} from './Typography'

export interface ChipProps {
  readonly name: string
  readonly trusted?: boolean
  readonly avatarSource?: RNImageProps['source']
}

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
  const avatarSize = getTokens().size.$5.val

  return (
    <ChipFrame trusted={trusted}>
      <Avatar
        source={avatarSource}
        customSize={avatarSize}
        trusted={trusted}
        trustBadgeRingColor="$accentYellowSecondary"
      >
        <UserImagePlaceholder size={avatarSize} />
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
