import styled from '@emotion/native'
import Button from '../../Button'
import {useAtomValue} from 'jotai'
import nextButtonStateAtom from '../state/nextButtonStateAtom'

const NextButtonStyled = styled(Button)`
  margin-top: 16px;
`

function defaultPress(): void {}

function NextButton(): JSX.Element | null {
  const nextButtonState = useAtomValue(nextButtonStateAtom)

  if (!nextButtonState.text) return null

  return (
    <NextButtonStyled
      disabled={nextButtonState.disabled || !nextButtonState.onPress}
      onPress={nextButtonState.onPress ?? defaultPress}
      variant="secondary"
      text={nextButtonState.text}
    />
  )
}

export default NextButton
