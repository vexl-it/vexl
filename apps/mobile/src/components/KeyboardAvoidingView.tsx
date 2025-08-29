import React, {type ReactNode} from 'react'
import {KeyboardAvoidingView as RNKeyboardAvoidingView} from 'react-native-keyboard-controller'
import {Stack} from 'tamagui'

function KeyboardAvoidingView({
  children,
}: {
  children: ReactNode
}): React.ReactElement {
  return (
    <RNKeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <Stack f={1}>{children}</Stack>
    </RNKeyboardAvoidingView>
  )
}

export default KeyboardAvoidingView
