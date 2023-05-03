import Button from '../../Button'
import {useAtomValue} from 'jotai'
import nextButtonStateAtom from '../state/nextButtonStateAtom'
import {XStack} from 'tamagui'

function defaultPress(): void {}

function NextButton(): JSX.Element | null {
  const nextButtonState = useAtomValue(nextButtonStateAtom)

  if (!nextButtonState.text) return null

  return (
    <XStack mt="$2" space={'$2'}>
      {nextButtonState.secondButton && (
        <Button
          fullSize
          adjustTextToFitOneLine
          variant="primary"
          onPress={nextButtonState.secondButton.onPress}
          text={nextButtonState.secondButton.text}
        />
      )}
      <Button
        fullSize
        adjustTextToFitOneLine
        disabled={nextButtonState.disabled || !nextButtonState.onPress}
        onPress={nextButtonState.onPress ?? defaultPress}
        variant="secondary"
        text={nextButtonState.text}
      />
    </XStack>
  )
}

export default NextButton
