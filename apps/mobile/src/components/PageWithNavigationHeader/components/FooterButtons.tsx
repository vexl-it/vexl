import {useAtomValue} from 'jotai'
import React from 'react'
import {XStack} from 'tamagui'
import Button from '../../Button'
import {
  primaryFooterButtonStateAtom,
  secondaryFooterButtonStateAtom,
} from '../state/footerButtonStateAtom'

const empty = (): void => {}

function FooterButtons(): JSX.Element | null {
  const primaryFooterButtonState = useAtomValue(primaryFooterButtonStateAtom)
  const secondaryFooterButtonState = useAtomValue(
    secondaryFooterButtonStateAtom
  )

  return (
    <XStack jc="space-around" space="$2">
      {!primaryFooterButtonState.hidden && (
        <Button
          fullSize
          disabled={primaryFooterButtonState.disabled}
          size="medium"
          onPress={primaryFooterButtonState.onPress ?? empty}
          variant="primary"
          text={primaryFooterButtonState.text}
        />
      )}
      {!secondaryFooterButtonState.hidden && (
        <Button
          fullSize
          disabled={secondaryFooterButtonState.disabled}
          size="medium"
          onPress={secondaryFooterButtonState.onPress ?? empty}
          variant="secondary"
          text={secondaryFooterButtonState.text}
        />
      )}
    </XStack>
  )
}

export default FooterButtons
