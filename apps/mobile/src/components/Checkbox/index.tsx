import {type StyleProp, type ViewStyle} from 'react-native'
import styled from '@emotion/native'
import checkedSvg from './image/checkedSvg'
import uncheckedSvg from './image/uncheckedSvg'
import Image from '../Image'

const Container = styled.TouchableWithoutFeedback``
const CheckboxImage = styled(Image)`
  width: 32px;
  height: 32px;
`

interface Props {
  style?: StyleProp<ViewStyle>
  value: boolean
  onChange: (value: boolean) => void
}

function Checkbox({style, value, onChange}: Props): JSX.Element {
  return (
    <Container
      onPress={() => {
        onChange(!value)
      }}
    >
      <CheckboxImage source={value ? checkedSvg : uncheckedSvg} style={style} />
    </Container>
  )
}

export default Checkbox
