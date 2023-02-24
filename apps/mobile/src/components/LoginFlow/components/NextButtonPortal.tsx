import {useSetNextButton} from '../state/nextButtonAtom'
import {useCallback} from 'react'

interface Props {
  text: string | null
  onPress?: () => void
  disabled: boolean
}

function NextButtonPortal(props: Props): null {
  useSetNextButton(
    useCallback(
      () => ({
        text: props.text ?? undefined,
        onPress: !props.disabled ? props.onPress : undefined,
      }),
      [props]
    )
  )
  return null
}

export default NextButtonPortal
