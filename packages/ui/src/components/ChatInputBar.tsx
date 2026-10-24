import React from 'react'
import {TextInput} from 'react-native'
import Animated, {useAnimatedStyle, withSpring} from 'react-native-reanimated'
import {useTheme} from 'tamagui'

import {Send} from '../icons/Send'
import {Stack, XStack} from '../primitives'
import {IconButton} from './IconButton'

export interface ChatInputBarProps {
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly onSendPress: () => void
  readonly placeholder: string
  readonly inputRef?: React.Ref<TextInput>
}

export function ChatInputBar({
  value,
  onChangeText,
  onSendPress,
  placeholder,
  inputRef,
}: ChatInputBarProps): React.JSX.Element {
  const theme = useTheme()

  const sendButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      marginRight: 5,
      opacity: withSpring(value ? 1 : 0),
    }
  }, [value])

  return (
    <XStack
      backgroundColor="$backgroundSecondary"
      gap="$3"
      alignItems="flex-end"
    >
      <Stack flex={1}>
        <XStack
          alignItems="center"
          gap="$3"
          my="$3"
          mx="$4"
          px="$6"
          py="$3"
          borderRadius="$9"
          backgroundColor="$backgroundOnBar"
        >
          <Stack flex={1} justifyContent="center">
            <TextInput
              ref={inputRef}
              multiline
              value={value}
              onChangeText={onChangeText}
              style={{
                minHeight: 21,
                maxHeight: 110,
                paddingVertical: 0,
                paddingHorizontal: 0,
                color: theme.foregroundPrimary.get(),
                fontFamily: 'TTSatoshi500',
                fontSize: 16,
              }}
              placeholder={placeholder}
              placeholderTextColor={theme.foregroundTertiary.get()}
              selectionColor={theme.accentHighlightPrimary.get()}
            />
          </Stack>
          <Animated.View style={sendButtonAnimatedStyle}>
            <IconButton
              width="$9"
              height="$9"
              borderRadius="$3"
              backgroundColor="$accentYellowSecondary"
              onPress={onSendPress}
            >
              <Send size={20} color={theme.accentHighlightPrimary.get()} />
            </IconButton>
          </Animated.View>
        </XStack>
      </Stack>
    </XStack>
  )
}
