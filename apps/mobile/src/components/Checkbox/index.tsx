import {
  type StyleProp,
  TouchableWithoutFeedback,
  type ViewStyle,
} from 'react-native'
import checkedSvg from './image/checkedSvg'
import uncheckedSvg from './image/uncheckedSvg'
import Image from '../Image'
import {Stack, styled} from 'tamagui'

interface Props {
  style?: StyleProp<ViewStyle>
  value: boolean
  onChange: (value: boolean) => void
  size?: 'small' | 'large' | '24x24'
}

const StackStyled = styled(Stack, {
  variants: {
    size: {
      small: {
        width: 16,
        height: 16,
      },
      large: {
        width: 32,
        height: 32,
      },
      '24x24': {
        width: 24,
        height: 24,
      },
    },
  },
})

function Checkbox({
  style,
  value,
  onChange,
  size = 'large',
}: Props): JSX.Element {
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        onChange(!value)
      }}
    >
      <StackStyled size={size}>
        <Image source={value ? checkedSvg : uncheckedSvg} style={style} />
      </StackStyled>
    </TouchableWithoutFeedback>
  )
}

export default Checkbox
