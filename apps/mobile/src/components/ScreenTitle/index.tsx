import closeSvg from '../TosScreen/images/closeSvg'
import {Stack, Text} from 'tamagui'
import IconButton from '../IconButton'

interface Props {
  onClosePress: () => void
  text: string
  variant: 'light' | 'dark'
}

function ScreenTitle({onClosePress, text, variant}: Props): JSX.Element {
  return (
    <Stack fd="row" ai="flex-start" jc="space-between" padding="$1" mb="$5">
      <Stack fs={1}>
        <Text color="$white" fontSize={32} ff="$heading">
          {text}
        </Text>
      </Stack>
      <IconButton variant={variant} icon={closeSvg} onPress={onClosePress} />
    </Stack>
  )
}

export default ScreenTitle
