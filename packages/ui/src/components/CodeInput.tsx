import {Array, pipe} from 'effect'
import React from 'react'
import {Platform, TextInput, TouchableOpacity} from 'react-native'
import {getTokens, styled} from 'tamagui'

import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

const CodeBox = styled(YStack, {
  name: 'CodeBox',
  flex: 1,
  maxWidth: '$10',
  height: '$10',
  alignItems: 'center',
  justifyContent: 'center',
  borderColor: '$backgroundHighlight',
  borderRadius: '$3',
  borderWidth: 1,
})

export interface CodeInputProps {
  readonly value: string
  readonly onChangeText: (digits: string) => void
  readonly maxLength: number
  // Shows a box for every typed digit plus the next one, up to maxLength.
  readonly minLength?: number
  readonly secure?: boolean
  readonly oneTimeCode?: boolean
  readonly editable?: boolean
  readonly inputRef?: React.RefObject<TextInput | null>
}

export function CodeInput({
  value,
  onChangeText,
  maxLength,
  minLength = maxLength,
  secure,
  oneTimeCode,
  editable,
  inputRef: inputRefFromProps,
}: CodeInputProps): React.JSX.Element {
  const ownInputRef = React.useRef<TextInput>(null)
  const inputRef = inputRefFromProps ?? ownInputRef
  const boxCount = Math.min(Math.max(value.length + 1, minLength), maxLength)

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        inputRef.current?.focus()
      }}
    >
      <YStack>
        <TextInput
          autoComplete={
            oneTimeCode
              ? Platform.OS === 'android'
                ? 'sms-otp'
                : 'one-time-code'
              : 'off'
          }
          autoFocus
          caretHidden
          editable={editable}
          importantForAutofill={oneTimeCode ? 'yes' : 'no'}
          keyboardType="number-pad"
          maxLength={maxLength}
          onChangeText={(text) => {
            onChangeText(text.replace(/\D/g, '').substring(0, maxLength))
          }}
          pointerEvents="none"
          ref={inputRef}
          style={{
            height: getTokens().size.$10.val,
            opacity: 0,
            position: 'absolute',
            width: '100%',
            zIndex: getTokens().zIndex.$5.val,
          }}
          textContentType={oneTimeCode ? 'oneTimeCode' : 'none'}
          value={value}
        />
        <XStack gap="$2" justifyContent="center">
          {pipe(
            Array.makeBy(boxCount, (index) => value.charAt(index)),
            Array.map((digit, index) => (
              <CodeBox key={index}>
                <Typography color="$foregroundPrimary" variant="paragraph">
                  {secure && digit !== '' ? '•' : digit}
                </Typography>
              </CodeBox>
            ))
          )}
        </XStack>
      </YStack>
    </TouchableOpacity>
  )
}
