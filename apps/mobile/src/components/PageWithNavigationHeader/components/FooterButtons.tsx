import {useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {XStack} from 'tamagui'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import Button from '../../Button'
import {
  primaryFooterButtonStateAtom,
  secondaryFooterButtonStateAtom,
} from '../state/footerButtonStateAtom'

function FooterButtons(): JSX.Element | null {
  const primaryFooterButtonState = useAtomValue(primaryFooterButtonStateAtom)
  const secondaryFooterButtonState = useAtomValue(
    secondaryFooterButtonStateAtom
  )

  const onPrimaryButtonPress = useCallback(() => {
    const onPress = primaryFooterButtonState.onPress
    if (!onPress) return
    void dismissKeyboardAndResolveOnLayoutUpdate().then(onPress)
  }, [primaryFooterButtonState.onPress])

  const onSecondaryButtonPress = useCallback(() => {
    const onPress = secondaryFooterButtonState.onPress
    if (!onPress) return
    void dismissKeyboardAndResolveOnLayoutUpdate().then(onPress)
  }, [secondaryFooterButtonState.onPress])

  return (
    <XStack jc="space-around" gap="$2" pt="$1">
      {!primaryFooterButtonState.hidden && (
        <Button
          fullSize
          disabled={primaryFooterButtonState.disabled}
          size="medium"
          onPress={onPrimaryButtonPress}
          variant="primary"
          text={primaryFooterButtonState.text}
        />
      )}
      {!secondaryFooterButtonState.hidden && (
        <Button
          fullSize
          disabled={secondaryFooterButtonState.disabled}
          size="medium"
          onPress={onSecondaryButtonPress}
          variant="secondary"
          text={secondaryFooterButtonState.text}
        />
      )}
    </XStack>
  )
}

export default FooterButtons
