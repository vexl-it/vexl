import {useFocusEffect} from '@react-navigation/native'
import {useCallback} from 'react'
import {Keyboard, type TextInput} from 'react-native'

/**
 * Focuses the input when the screen gets focus and again whenever the
 * keyboard hides, unless `shouldSkipFocus` says otherwise.
 */
export function useKeepInputFocused(
  inputRef: React.RefObject<TextInput | null>,
  shouldSkipFocus: () => boolean
): void {
  useFocusEffect(
    useCallback(() => {
      let refocusTimeout: ReturnType<typeof setTimeout> | undefined

      const focusInput = (): void => {
        if (shouldSkipFocus()) return

        inputRef.current?.focus()
      }

      const scheduleFocus = (): void => {
        if (refocusTimeout !== undefined) clearTimeout(refocusTimeout)
        refocusTimeout = setTimeout(focusInput, 50)
      }

      scheduleFocus()

      const keyboardDidHideSubscription = Keyboard.addListener(
        'keyboardDidHide',
        scheduleFocus
      )

      return () => {
        if (refocusTimeout !== undefined) clearTimeout(refocusTimeout)
        keyboardDidHideSubscription.remove()
      }
    }, [inputRef, shouldSkipFocus])
  )
}
