import {
  type StyleProp,
  TouchableWithoutFeedback,
  type ViewStyle,
} from 'react-native'
import checkedSvg from './image/checkedSvg'
import uncheckedSvg from './image/uncheckedSvg'
import Image from '../Image'
import {Stack} from 'tamagui'

interface Props {
  style?: StyleProp<ViewStyle>
  value: boolean
  onChange: (value: boolean) => void
}

function Checkbox({style, value, onChange}: Props): JSX.Element {
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        onChange(!value)
      }}
    >
      <Stack w={32} h={32}>
        <Image source={value ? checkedSvg : uncheckedSvg} style={style} />
      </Stack>
    </TouchableWithoutFeedback>
  )
}

export default Checkbox
