import React from 'react'
import {styled, useTheme} from 'tamagui'

import {Circle, SizableText, XStack, YStack} from '../primitives'

export interface NotificationCardProps {
  readonly avatar: React.ReactNode
  readonly name: string
  readonly time: string
  readonly category: string
  readonly message: string
  readonly tag?: React.ReactNode
  readonly onPress?: () => void
}

const CardFrame = styled(YStack, {
  name: 'NotificationCard',
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
  name: 'NotificationCardHeader',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
  alignItems: 'flex-start',
})

const ContentFrame = styled(YStack, {
  name: 'NotificationCardContent',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
  overflow: 'hidden',
})

const NameText = styled(SizableText, {
  name: 'NotificationCardName',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundPrimary',
  numberOfLines: 1,
})

const SubtitleText = styled(SizableText, {
  name: 'NotificationCardSubtitle',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundSecondary',
})

const MessageText = styled(SizableText, {
  name: 'NotificationCardMessage',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundSecondary',
})

export function NotificationCard({
  avatar,
  name,
  time,
  category,
  message,
  tag,
  onPress,
}: NotificationCardProps): React.JSX.Element {
  const theme = useTheme()
  const isPressable = !!onPress

  return (
    <CardFrame pressable={isPressable} onPress={onPress}>
      <HeaderFrame>
        <XStack flex={1} gap="$3" alignItems="center" overflow="hidden">
          {avatar}
          <YStack gap="$1" flexShrink={1}>
            <NameText>{name}</NameText>
            <XStack gap="$2" alignItems="center">
              <SubtitleText>{time}</SubtitleText>
              <Circle
                size="$2"
                backgroundColor={theme.foregroundSecondary.val}
              />
              <SubtitleText>{category}</SubtitleText>
            </XStack>
          </YStack>
        </XStack>
        {tag ?? null}
      </HeaderFrame>
      <ContentFrame>
        <MessageText>{message}</MessageText>
      </ContentFrame>
    </CardFrame>
  )
}
