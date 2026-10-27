import React from 'react'
import {useTheme} from 'tamagui'

import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export type ChatBubbleVariant = 'incoming' | 'outgoing'

export interface ChatBubbleQuote {
  readonly label: string
  readonly text: string
  readonly image?: React.ReactNode
}

export interface ChatBubbleRenderTextArgs {
  readonly text: string
  readonly color: string
}

export interface ChatBubbleProps {
  readonly variant: ChatBubbleVariant
  readonly text: string
  /** Replaces the default text rendering, e.g. to linkify the message. */
  readonly renderText?: (args: ChatBubbleRenderTextArgs) => React.ReactNode
  /** Replied-to message shown above the bubble. */
  readonly quote?: ChatBubbleQuote
  /** Small caption shown above the bubble, e.g. "Requested with". */
  readonly notice?: string
  /** Attached image shown above the bubble. */
  readonly image?: React.ReactNode
}

function ChatBubbleHeader({
  variant,
  children,
}: {
  readonly variant: ChatBubbleVariant
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <XStack
      borderRadius="$5"
      marginBottom="$0.5"
      borderBottomLeftRadius="$2"
      borderBottomRightRadius="$2"
      backgroundColor={
        variant === 'outgoing'
          ? '$accentYellowSecondary'
          : '$backgroundSecondary'
      }
      padding="$4"
      paddingBottom="$3"
      paddingTop="$4"
      gap="$2"
    >
      {children}
    </XStack>
  )
}

export function ChatBubble({
  variant,
  text,
  renderText,
  quote,
  notice,
  image,
}: ChatBubbleProps): React.JSX.Element {
  const theme = useTheme()
  const isOutgoing = variant === 'outgoing'
  const textColor = isOutgoing
    ? theme.black100.get()
    : theme.foregroundPrimary.get()
  const hasHeader = !!quote || !!notice

  return (
    <Stack>
      {quote ? (
        <ChatBubbleHeader variant={variant}>
          <YStack gap="$1">
            {quote.image}
            <Typography color="$foregroundSecondary" variant="micro">
              {quote.label}
            </Typography>
            <Typography
              color="$foregroundPrimary"
              variant="micro"
              marginTop="$1"
            >
              {quote.text}
            </Typography>
          </YStack>
        </ChatBubbleHeader>
      ) : null}
      {notice ? (
        <ChatBubbleHeader variant={variant}>
          <Typography color="$foregroundSecondary" variant="micro">
            {notice}
          </Typography>
        </ChatBubbleHeader>
      ) : null}
      {image ? (
        <YStack
          borderRadius="$4"
          padding="$3"
          marginBottom="$2"
          backgroundColor="$backgroundTertiary"
        >
          {image}
        </YStack>
      ) : null}
      <Stack
        borderRadius="$6"
        borderTopLeftRadius={hasHeader ? '$2' : '$6'}
        borderTopRightRadius={hasHeader ? '$2' : '$6'}
        backgroundColor={
          isOutgoing ? '$accentYellowPrimary' : '$backgroundTertiary'
        }
        px="$4"
        pb="$4"
        pt="$4"
      >
        {renderText ? (
          renderText({text, color: textColor})
        ) : (
          <Typography color={textColor} variant="paragraph">
            {text}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
