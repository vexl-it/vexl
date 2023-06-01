import {Keyboard, Platform} from 'react-native'

/**
 * Dismisses the keyboard and returns a promise that resolves when the keyboard is dismissed.
 * If the keyboard is not visible, the promise resolves immediately.
 */
export function dismissKeyboardAndResolveOnLayoutUpdate(): Promise<void> {
  return new Promise((resolve) => {
    // On android, this is not a problem. Layout is updated immediately.
    if (Platform.OS === 'android' || !Keyboard.isVisible()) {
      resolve()
      return
    }

    // When keyboardWillHide event is emitted, the layout is already updated.
    // So we can resolve the promise.
    const listener = Keyboard.addListener('keyboardWillHide', () => {
      resolve()
      listener.remove()
    })
    Keyboard.dismiss()
  })
}
