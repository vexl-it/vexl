import {useAtomValue} from 'jotai'
import {useKeyboardState} from 'react-native-keyboard-controller'
import {getTokens} from 'tamagui'

import {useScreenFooterHeight} from './Screen'

interface Options {
  readonly footerHeight?: number
  readonly footerHeightFallback?: number
  readonly keyboardHeightOffset?: number
}

export function useKeyboardAwareFooterListPadding({
  footerHeight,
  footerHeightFallback = getTokens().space.$13.val,
  keyboardHeightOffset = 0,
}: Options = {}): number {
  const {footerHeightAtom} = useScreenFooterHeight()
  const screenFooterHeight = useAtomValue(footerHeightAtom)
  const keyboardHeight = useKeyboardState((state) =>
    state.isVisible ? state.height : 0
  )
  const resolvedFooterHeight = footerHeight ?? screenFooterHeight
  const footerListPadding = resolvedFooterHeight ?? footerHeightFallback
  const keyboardListPadding = Math.max(0, keyboardHeight - keyboardHeightOffset)

  return footerListPadding + keyboardListPadding
}
