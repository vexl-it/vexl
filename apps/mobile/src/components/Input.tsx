import {type TextInputProps} from 'react-native'
import styled from '@emotion/native'

const RootContainer = styled.View`
  background-color: #f2f2f2;
  padding: 16px;
  border-radius: 10px;
  margin: 0 -16px;
`
const InputStyled = styled.TextInput`
  font-size: 18px;
  font-family: '${(p) => p.theme.fonts.ttSatoshi500}';
`

function TextInput(props: TextInputProps): JSX.Element {
  const {style, ...restProps} = props
  return (
    <RootContainer style={style}>
      <InputStyled placeholderTextColor="#848484" {...restProps} />
    </RootContainer>
  )
}

export default TextInput
