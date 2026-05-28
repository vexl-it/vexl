import React from 'react'
import {
  Keyboard,
  TouchableWithoutFeedback,
  type TouchableWithoutFeedbackProps,
} from 'react-native'

export interface DismissKeyboardOnPressOutsideProps
  extends Omit<
    TouchableWithoutFeedbackProps,
    'accessible' | 'children' | 'onPress'
  > {
  readonly children: React.ReactNode
}

export function DismissKeyboardOnPressOutside({
  children,
  ...props
}: DismissKeyboardOnPressOutsideProps): React.JSX.Element {
  return (
    <TouchableWithoutFeedback
      {...props}
      accessible={false}
      onPress={Keyboard.dismiss}
    >
      {children}
    </TouchableWithoutFeedback>
  )
}
