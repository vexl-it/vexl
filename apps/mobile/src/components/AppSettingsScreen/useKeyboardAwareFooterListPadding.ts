import {useScreenFooterHeight} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import {useKeyboardState} from 'react-native-keyboard-controller'
import {getTokens} from 'tamagui'

export function useKeyboardAwareFooterListPadding(): number {
  const {footerHeightAtom} = useScreenFooterHeight()
  const footerHeight = useAtomValue(footerHeightAtom)
  const keyboardHeight = useKeyboardState((state) =>
    state.isVisible ? state.height : 0
  )

  return (footerHeight || getTokens().space.$13.val) + keyboardHeight
}
