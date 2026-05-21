import React from 'react'
import {
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  type KeyboardAvoidingViewProps,
} from 'react-native-keyboard-controller'

export function KeyboardAvoidingView({
  children,
  style,
  ...props
}: Omit<
  KeyboardAvoidingViewProps,
  'behavior' | 'contentContainerStyle'
>): React.JSX.Element {
  return (
    <RNKeyboardAvoidingView
      {...props}
      behavior="height"
      style={[{flex: 1}, style]}
    >
      {children}
    </RNKeyboardAvoidingView>
  )
}
