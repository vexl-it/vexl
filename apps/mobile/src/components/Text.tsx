import {type TextProps} from 'react-native'
import styled from '@emotion/native'

interface Props extends TextProps {
  colorStyle: 'white' | 'black'
}

const TextStyled = styled.Text`
  color: ${(p: Props) => p.colorStyle};
  font-family: '${(p) => p.theme.fonts.ttSatoshi400}';
`

function Text(props: Props): JSX.Element {
  return <TextStyled {...props} style={props.style} />
}

export default Text
