import React from 'react'
import {
  Keyboard,
  TouchableWithoutFeedback,
  type TouchableWithoutFeedbackProps,
} from 'react-native'

export interface DismissKeyboardOnPressOutsideProps extends Omit<
  TouchableWithoutFeedbackProps,
  'accessible' | 'children' | 'onPress'
> {
  readonly children: React.ReactNode
}

/**
 * Dismisses the keyboard when the wrapped (non-interactive) area is pressed.
 *
 * WARNING: never wrap a scrollable (FlashList/FlatList/ScrollView) in this
 * component. TouchableWithoutFeedback injects JS-responder handlers into the
 * child, and on the new architecture (RN 0.86) the responder never hands off
 * to the native scroll gesture — the list stops scrolling entirely while taps
 * keep working. For scrollables use `keyboardDismissMode="on-drag"` and
 * `keyboardShouldPersistTaps="handled"` on the list itself instead.
 */

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
