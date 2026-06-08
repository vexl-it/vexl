import {Platform} from 'react-native'
import {
  KeyboardController,
  KeyboardEvents,
} from 'react-native-keyboard-controller'

const KEYBOARD_HIDE_FALLBACK_TIMEOUT_MS = 500

function runAfterLayoutSettles(callback: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}

function emptyOnError(): void {}

/**
 * Dismisses the keyboard and returns a promise that resolves when the keyboard
 * hide animation has finished and the layout has settled.
 * If the keyboard is not visible, the promise resolves immediately.
 */
export function dismissKeyboardAndResolveOnLayoutUpdate(): Promise<void> {
  return new Promise((resolve) => {
    // On android, this is not a problem. Layout is updated immediately.
    if (Platform.OS === 'android') {
      void KeyboardController.dismiss({animated: true}).then(
        undefined,
        emptyOnError
      )
      resolve()
      return
    }

    let settled = false

    const resolveOnce = (): void => {
      if (settled) return

      settled = true
      keyboardControllerDidHideListener.remove()
      clearTimeout(fallbackTimeout)
      runAfterLayoutSettles(resolve)
    }

    const keyboardControllerDidHideListener = KeyboardEvents.addListener(
      'keyboardDidHide',
      resolveOnce
    )

    const fallbackTimeout = setTimeout(() => {
      resolveOnce()
    }, KEYBOARD_HIDE_FALLBACK_TIMEOUT_MS)

    void KeyboardController.dismiss({animated: true}).then(
      resolveOnce,
      emptyOnError
    )

    if (!KeyboardController.isVisible()) {
      resolveOnce()
    }
  })
}

export function runAfterKeyboardDismiss(action: () => void): void {
  void dismissKeyboardAndResolveOnLayoutUpdate().then(action)
}
