import React from 'react'
import {styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {SizableText, XStack, YStack} from '../primitives'

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

const NameText = styled(SizableText, {
  name: 'ClubCardName',
  fontFamily: '$heading',
  fontWeight: '700',
  fontSize: '$1',
  letterSpacing: '$1',
  color: '$foregroundPrimary',
})

const SubtitleText = styled(SizableText, {
  name: 'ClubCardSubtitle',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  color: '$foregroundSecondary',
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
  const iconColor = theme.foregroundSecondary.val

  return (
    <ClubCardFrame pressable={!!onPress} onPress={onPress}>
      {avatar}
      <YStack flex={1} justifyContent="center" gap="$1">
        <NameText>{name}</NameText>
        <XStack alignItems="center" gap="$1">
          <PeopleUsers size={16} color={iconColor} />
          <SubtitleText>{subtitle}</SubtitleText>
        </XStack>
      </YStack>
      {tag}
    </ClubCardFrame>
  )
}
