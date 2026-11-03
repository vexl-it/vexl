import React from 'react'

import type {DismissKeyboardOnPressOutsideProps} from './DismissKeyboardOnPressOutside'

// Browsers already blur the focused input when the user clicks outside it.
export function DismissKeyboardOnPressOutside({
  children,
}: DismissKeyboardOnPressOutsideProps): React.JSX.Element {
  return <>{children}</>
}
