import {useAtomValue} from 'jotai'
import React from 'react'
import Button from '../../Button'
import footerButtonStateAtom from '../state/footerButtonStateAtom'

function FooterButton(): JSX.Element | null {
  const footerButtonState = useAtomValue(footerButtonStateAtom)

  return !footerButtonState.hidden ? (
    <Button
      fullWidth
      disabled={footerButtonState.disabled}
      size="medium"
      onPress={footerButtonState.onPress}
      variant="secondary"
      text={footerButtonState.text}
    />
  ) : null
}

export default FooterButton
