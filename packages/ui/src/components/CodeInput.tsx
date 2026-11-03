import {Array} from 'effect'
import React, {useRef} from 'react'
import {TextInput, type TextInputProps} from 'react-native'
import {getTokens} from 'tamagui'
import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface CodeInputProps {
  readonly length: number
  readonly value: string
  readonly onChangeText: (digits: string) => void
  readonly invalid?: boolean
  readonly disabled?: boolean
  readonly autoFocus?: boolean
  readonly autoComplete?: TextInputProps['autoComplete']
  readonly textContentType?: TextInputProps['textContentType']
  readonly inputRef?: React.RefObject<TextInput | null>
}

function CodeBox({
  digit,
  invalid,
  disabled,
}: {
  readonly digit: string
  readonly invalid: boolean
  readonly disabled: boolean
}): React.JSX.Element {
  return (
    <YStack
      width="$10"
      height="$10"
      alignItems="center"
      justifyContent="center"
      borderWidth={1}
      borderRadius="$3"
      borderColor={invalid ? '$redForeground' : '$backgroundHighlight'}
      backgroundColor={disabled ? '$backgroundTertiary' : '$backgroundPrimary'}
    >
      <Typography
        variant="paragraph"
        color={disabled ? '$foregroundSecondary' : '$foregroundPrimary'}
      >
        {digit}
      </Typography>
    </YStack>
  )
}

export function CodeInput({
  length,
  value,
  onChangeText,
  invalid = false,
  disabled = false,
  autoFocus = true,
  autoComplete,
  textContentType,
  inputRef,
}: CodeInputProps): React.JSX.Element {
  const ownInputRef = useRef<TextInput>(null)
  const ref = inputRef ?? ownInputRef
  const {size, zIndex} = getTokens()

  return (
    <Stack
      disabled={disabled}
      onPress={() => {
        ref.current?.focus()
      }}
    >
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(text) => {
          onChangeText(text.replace(/\D/g, '').substring(0, length))
        }}
        maxLength={length}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        textContentType={textContentType}
        importantForAutofill="yes"
        editable={!disabled}
        caretHidden
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          width: '100%',
          height: size.$10.val,
          opacity: 0,
          zIndex: zIndex.$5.val,
        }}
      />
      <XStack gap="$2" justifyContent="center">
        {Array.makeBy(length, (index) => (
          <CodeBox
            key={index}
            digit={value.charAt(index)}
            invalid={invalid}
            disabled={disabled}
          />
        ))}
      </XStack>
    </Stack>
  )
}
