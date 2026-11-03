import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

const ClubCardFrame = styled(XStack, {
  name: 'ClubCardFrame',
  alignItems: 'center',
  padding: '$4',
  gap: '$3',
  borderRadius: '$5',
  backgroundColor: '$backgroundTertiary',

  variants: {
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,

  defaultVariants: {
    pressable: false,
  },
})

export interface ClubCardProps {
  readonly avatar: React.ReactNode
  readonly name: string
  readonly subtitle: string
  readonly tag?: React.ReactNode
  readonly onPress?: () => void
}

export function ClubCard({
  avatar,
  name,
  subtitle,
  tag,
  onPress,
}: ClubCardProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = theme.foregroundSecondary.get()

  return (
    <ClubCardFrame pressable={!!onPress} onPress={onPress}>
      {avatar}
      <YStack flex={1} justifyContent="center" gap="$1">
        <Typography
          variant="tabSmallBold"
          color="$foregroundPrimary"
          numberOfLines={2}
        >
          {name}
        </Typography>
        <XStack alignItems="center" gap="$1">
          <PeopleUsers size={getTokens().size['$4.5'].val} color={iconColor} />
          <Typography variant="micro" color="$foregroundSecondary">
            {subtitle}
          </Typography>
        </XStack>
      </YStack>
      {tag}
    </ClubCardFrame>
  )
}
