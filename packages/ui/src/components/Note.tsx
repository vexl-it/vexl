import React, {useMemo} from 'react'
import {styled, useTheme} from 'tamagui'

import {Calendar} from '../icons/Calendar'
import {PeopleUsers} from '../icons/PeopleUsers'
import {SizableText, XStack, YStack} from '../primitives'

export interface NoteProps {
  readonly avatar: React.ReactNode
  readonly name: string
  readonly commonFriends: string
  readonly expiration: string
  readonly message: string
  readonly onPress?: () => void
}

const CardFrame = styled(YStack, {
  name: 'Note',
  gap: '$0.5',

  variants: {
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,
})

const HeaderFrame = styled(XStack, {
  name: 'NoteHeader',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
  alignItems: 'center',
  gap: '$3',
})

const ContentFrame = styled(YStack, {
  name: 'NoteContent',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
  overflow: 'hidden',
})

const NameText = styled(SizableText, {
  name: 'NoteName',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundPrimary',
  numberOfLines: 1,
})

const DetailText = styled(SizableText, {
  name: 'NoteDetailText',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundSecondary',
})

const MessageText = styled(SizableText, {
  name: 'NoteMessage',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundSecondary',
})

export function Note({
  avatar,
  name,
  commonFriends,
  expiration,
  message,
  onPress,
}: NoteProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = useMemo(
    () => theme.foregroundSecondary.val,
    [theme.foregroundSecondary]
  )
  const isPressable = !!onPress

  return (
    <CardFrame pressable={isPressable} onPress={onPress}>
      <HeaderFrame>
        {avatar}
        <YStack gap="$1" flexShrink={1}>
          <NameText>{name}</NameText>
          <XStack gap="$3" alignItems="center">
            <XStack gap="$1" alignItems="center">
              <PeopleUsers size={16} color={iconColor} />
              <DetailText>{commonFriends}</DetailText>
            </XStack>
            <XStack gap="$1" alignItems="center">
              <Calendar size={16} color={iconColor} />
              <DetailText>{expiration}</DetailText>
            </XStack>
          </XStack>
        </YStack>
      </HeaderFrame>
      <ContentFrame>
        <MessageText>{message}</MessageText>
      </ContentFrame>
    </CardFrame>
  )
}
