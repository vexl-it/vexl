import {type ReactNode} from 'react'
import {
  Platform,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
} from 'react-native'
import {Stack} from 'tamagui'

function KeyboardAvoidingView({children}: {children: ReactNode}): JSX.Element {
  return (
    <RNKeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1}}
    >
      <Stack flex={1}>{children}</Stack>
    </RNKeyboardAvoidingView>
  )
}

export default KeyboardAvoidingView
