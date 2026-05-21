import React from 'react'
import {
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  type KeyboardAvoidingViewProps,
} from 'react-native-keyboard-controller'

export function KeyboardAvoidingView({
  behavior = 'height',
  children,
  style,
  ...props
}: Omit<
  KeyboardAvoidingViewProps,
  'contentContainerStyle'
>): React.JSX.Element {
  return (
    <RNKeyboardAvoidingView
      {...props}
      behavior={behavior}
      style={[{flex: 1}, style]}
    >
      {children}
    </RNKeyboardAvoidingView>
  )
}
