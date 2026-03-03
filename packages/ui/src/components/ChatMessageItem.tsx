import React from 'react'
import {View} from 'react-native'
import {styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {SizableText, XStack, YStack} from '../primitives'
import {Dot} from './Dot'
import {DotTypingIndicator} from './DotTypingIndicator'

export type ChatMessageItemVariant =
  | 'default'
  | 'highlighted'
  | 'destructive'
  | 'success'

export interface ChatMessageItemProps {
  readonly avatar: React.ReactNode
  readonly name: string
  readonly message: string
  readonly time: string
  readonly unread?: boolean
  readonly variant?: ChatMessageItemVariant
  readonly icon?: React.ComponentType<IconProps>
  readonly isTyping?: boolean
  readonly grayscaleAvatar?: boolean
  readonly onPress?: () => void
}

const ChatMessageItemFrame = styled(XStack, {
  name: 'ChatMessageItem',
  alignItems: 'center',
  paddingVertical: '$4',
  gap: '$5',

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

const NameText = styled(SizableText, {
  name: 'ChatMessageItemName',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$3',
  letterSpacing: '$3',
  lineHeight: '$3',
  color: '$foregroundPrimary',
  numberOfLines: 1,
})

const MessageText = styled(SizableText, {
  name: 'ChatMessageItemMessage',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  numberOfLines: 1,

  variants: {
    variant: {
      default: {color: '$foregroundSecondary'},
      highlighted: {color: '$accentHighlightSecondary'},
      destructive: {color: '$redForeground'},
      success: {color: '$greenForeground'},
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

const TimeText = styled(SizableText, {
  name: 'ChatMessageItemTime',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundSecondary',
  flexShrink: 0,
})

export function ChatMessageItem({
  avatar,
  name,
  message,
  time,
  unread = false,
  variant = 'default',
  icon: Icon,
  isTyping = false,
  grayscaleAvatar = false,
  onPress,
}: ChatMessageItemProps): React.JSX.Element {
  const theme = useTheme()
  const isPressable = !!onPress

  const iconColor = (() => {
    switch (variant) {
      case 'highlighted':
        return theme.accentHighlightSecondary.val
      case 'destructive':
        return theme.redForeground.val
      case 'success':
        return theme.greenForeground.val
      case 'default':
        return theme.foregroundSecondary.val
    }
  })()

  return (
    <ChatMessageItemFrame pressable={isPressable} onPress={onPress}>
      {grayscaleAvatar ? (
        <View style={{filter: [{grayscale: 1}]}}>{avatar}</View>
      ) : (
        avatar
      )}
      <YStack flex={1} gap="$1">
        <XStack alignItems="center" gap="$2">
          <NameText flexShrink={1}>{name}</NameText>
          {unread ? <Dot backgroundColor="$accentYellowPrimary" /> : null}
        </XStack>
        <XStack alignItems="center" gap="$3">
          <XStack flex={1} alignItems="center" gap="$1">
            {Icon ? <Icon color={iconColor} size={24} /> : null}
            {isTyping ? (
              <DotTypingIndicator />
            ) : message ? (
              <MessageText variant={variant} flex={1}>
                {message}
              </MessageText>
            ) : null}
          </XStack>
          <TimeText>{time}</TimeText>
        </XStack>
      </YStack>
    </ChatMessageItemFrame>
  )
}
