import React from 'react'
import type {TextInput} from 'react-native'
import Animated, {
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {getTokens, useTheme} from 'tamagui'

import {Send} from '../icons/Send'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import {XStack, YStack} from '../primitives'
import {FieldInput} from './Field'
import {NavButton} from './NavButton'
import {ReplyPreview} from './ReplyPreview'

const INPUT_MIN_HEIGHT = 21
const INPUT_MAX_HEIGHT = 110
const REPLY_ANIMATION_DURATION_MS = 180

export interface ChatComposerReply {
  /** e.g. "Reply to" */
  readonly label: string
  readonly text: string
  readonly image?: React.ReactNode
  readonly onDismiss: () => void
}

export interface ChatComposerProps {
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly onSend: () => void
  readonly placeholder?: string
  readonly reply?: ChatComposerReply
  readonly inputRef?: React.Ref<TextInput>
  readonly nativeID?: string
}

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  placeholder,
  reply,
  inputRef,
  nativeID,
}: ChatComposerProps): React.JSX.Element {
  const theme = useTheme()
  const hasText = value !== ''

  const sendButtonStyle = useAnimatedStyle(
    () => ({opacity: withSpring(hasText ? 1 : 0)}),
    [hasText]
  )

  return (
    <YStack backgroundColor="$backgroundSecondary">
      {reply ? (
        <Animated.View
          entering={SlideInDown.duration(REPLY_ANIMATION_DURATION_MS)}
          exiting={SlideOutDown.duration(REPLY_ANIMATION_DURATION_MS)}
          style={{overflow: 'hidden'}}
        >
          <XStack
            paddingVertical="$3"
            paddingHorizontal="$6"
            alignItems="center"
            gap="$2"
          >
            <ReplyPreview
              flex={1}
              label={reply.label}
              text={reply.text}
              image={reply.image}
            />
            <NavButton
              variant="transparent"
              icon={XmarkCancelClose}
              onPress={reply.onDismiss}
            />
          </XStack>
        </Animated.View>
      ) : null}
      <XStack
        alignItems="center"
        gap="$3"
        marginVertical="$3"
        marginHorizontal="$4"
        paddingHorizontal="$6"
        paddingVertical="$3"
        borderRadius="$9"
        backgroundColor="$backgroundOnBar"
      >
        <FieldInput
          ref={inputRef}
          nativeID={nativeID}
          multiline
          value={value}
          onChangeText={onChangeText}
          fontSize="$3"
          minHeight={INPUT_MIN_HEIGHT}
          maxHeight={INPUT_MAX_HEIGHT}
          placeholder={placeholder}
          placeholderTextColor={theme.foregroundTertiary.get()}
          selectionColor={theme.accentHighlightPrimary.get()}
        />
        <Animated.View
          style={[{marginRight: getTokens().space.$2.val}, sendButtonStyle]}
        >
          <NavButton icon={Send} onPress={onSend} />
        </Animated.View>
      </XStack>
    </YStack>
  )
}
