import React from 'react'
import {KeyboardAvoidingView as RNKeyboardAvoidingView} from 'react-native-keyboard-controller'
import {Stack} from '../primitives'

export function KeyboardAvoidingView({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <RNKeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <Stack flex={1}>{children}</Stack>
    </RNKeyboardAvoidingView>
  )
}
