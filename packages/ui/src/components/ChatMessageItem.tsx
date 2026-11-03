import {Array, pipe} from 'effect'
import React from 'react'
import {View} from 'react-native'
import {getTokens, styled, useTheme} from 'tamagui'

import {TagLabel} from '../icons/TagLabel'
import type {IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import {Dot} from './Dot'
import {DotTypingIndicator} from './DotTypingIndicator'
import {HighlightedText} from './HighlightedText'
import {Typography} from './Typography'

export type ChatMessageItemVariant =
  | 'default'
  | 'highlighted'
  | 'destructive'
  | 'success'

export interface ChatMessageItemProps {
  readonly avatar: React.ReactNode
  readonly name: string
  /** Highlights matches of this query in `name`. */
  readonly highlightQuery?: string
  readonly message: string
  readonly time: React.ReactNode
  readonly unread?: boolean
  readonly variant?: ChatMessageItemVariant
  readonly icon?: React.ComponentType<IconProps>
  readonly isTyping?: boolean
  readonly grayscaleAvatar?: boolean
  readonly tags?: readonly string[]
  readonly onPress: () => void
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

const variantColor = {
  default: 'foregroundSecondary',
  highlighted: 'accentHighlightSecondary',
  destructive: 'redForeground',
  success: 'greenForeground',
} as const satisfies Record<ChatMessageItemVariant, string>

export function ChatMessageItem({
  avatar,
  name,
  highlightQuery,
  message,
  time,
  unread = false,
  variant = 'default',
  icon: Icon,
  isTyping = false,
  grayscaleAvatar = false,
  tags = [],
  onPress,
}: ChatMessageItemProps): React.JSX.Element {
  const theme = useTheme()
  const visibleTags = pipe(tags, Array.take(2))
  const remainingTagsCount = Math.max(0, tags.length - visibleTags.length)

  const colorKey = variantColor[variant]
  const sizes = getTokens().size

  return (
    <ChatMessageItemFrame pressable onPress={onPress}>
      {grayscaleAvatar ? (
        <View style={{filter: [{grayscale: 1}]}}>{avatar}</View>
      ) : (
        avatar
      )}
      <YStack flex={1} gap="$1">
        <XStack alignItems="center" gap="$2">
          {highlightQuery !== undefined ? (
            <HighlightedText
              text={name}
              query={highlightQuery}
              variant="paragraphSmall"
              color="$foregroundPrimary"
              numberOfLines={1}
              flexShrink={1}
            />
          ) : (
            <Typography
              variant="paragraphSmall"
              color="$foregroundPrimary"
              numberOfLines={1}
              flexShrink={1}
            >
              {name}
            </Typography>
          )}
          {unread ? <Dot backgroundColor="$accentYellowPrimary" /> : null}
        </XStack>
        <XStack alignItems="center" gap="$3">
          <XStack flex={1} alignItems="center" gap="$1">
            {Icon ? (
              <Icon color={theme[colorKey].get()} size={sizes.$7.val} />
            ) : null}
            {isTyping ? (
              <DotTypingIndicator />
            ) : message ? (
              <Typography
                variant="description"
                color={`$${colorKey}`}
                numberOfLines={1}
                flex={1}
              >
                {message}
              </Typography>
            ) : null}
          </XStack>
          <Typography
            variant="description"
            color="$foregroundSecondary"
            flexShrink={0}
          >
            {time}
          </Typography>
        </XStack>
        {Array.isNonEmptyArray(visibleTags) ? (
          <XStack alignItems="center" gap="$3" overflow="hidden">
            {pipe(
              visibleTags,
              Array.map((tag) => (
                <XStack key={tag} alignItems="center" gap="$1" flexShrink={1}>
                  <TagLabel
                    size={sizes.$5.val}
                    color={theme.foregroundSecondary.get()}
                  />
                  <Typography
                    variant="micro"
                    color="$foregroundSecondary"
                    numberOfLines={1}
                    flexShrink={1}
                  >
                    {tag}
                  </Typography>
                </XStack>
              ))
            )}
            {remainingTagsCount > 0 ? (
              <Typography
                variant="micro"
                color="$foregroundSecondary"
                flexShrink={0}
              >
                +{remainingTagsCount}
              </Typography>
            ) : null}
          </XStack>
        ) : null}
      </YStack>
    </ChatMessageItemFrame>
  )
}
