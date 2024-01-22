import {useAtomValue} from 'jotai'
import {useCallback} from 'react'
import {XStack} from 'tamagui'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import Button from '../../Button'
import nextButtonStateAtom from '../state/nextButtonStateAtom'

function emptyPress(): void {}

function NextButton(): JSX.Element | null {
  const nextButtonState = useAtomValue(nextButtonStateAtom)

  const onPrimaryButtonPress = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(
      nextButtonState.onPress ?? emptyPress
    )
  }, [nextButtonState.onPress])

  const onSecondButtonPress = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(
      nextButtonState.secondButton?.onPress ?? emptyPress
    )
  }, [nextButtonState.secondButton?.onPress])

  if (!nextButtonState.text) return null

  return (
    <XStack mt="$2" space="$2">
      {nextButtonState.secondButton && (
        <Button
          fullSize
          adjustTextToFitOneLine
          variant="primary"
          onPress={onSecondButtonPress}
          text={nextButtonState.secondButton.text}
        />
      )}
      <Button
        fullSize
        adjustTextToFitOneLine
        disabled={nextButtonState.disabled || !nextButtonState.onPress}
        onPress={onPrimaryButtonPress}
        variant="secondary"
        text={nextButtonState.text}
      />
    </XStack>
  )
}

export default NextButton
