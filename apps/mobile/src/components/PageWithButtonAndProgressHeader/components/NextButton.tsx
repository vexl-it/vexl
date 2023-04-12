import Button from '../../Button'
import {useAtomValue} from 'jotai'
import nextButtonStateAtom from '../state/nextButtonStateAtom'
import {Stack} from 'tamagui'

function defaultPress(): void {}

function NextButton(): JSX.Element | null {
  const nextButtonState = useAtomValue(nextButtonStateAtom)

  if (!nextButtonState.text) return null

  return (
    <Stack mt="$4">
      <Button
        disabled={nextButtonState.disabled || !nextButtonState.onPress}
        onPress={nextButtonState.onPress ?? defaultPress}
        variant="secondary"
        text={nextButtonState.text}
      />
    </Stack>
  )
}

export default NextButton
