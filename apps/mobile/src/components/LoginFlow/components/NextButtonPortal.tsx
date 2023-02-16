import {useSetNextButton} from '../state/nextButtonAtom'

interface Props {
  text: string | null
  onPress?: () => void
  disabled: boolean
}

function NextButtonPortal(props: Props): null {
  useSetNextButton(
    () => ({
      text: props.text ?? undefined,
      onPress: !props.disabled ? props.onPress : undefined,
    }),
    [props]
  )
  return null
}

export default NextButtonPortal
