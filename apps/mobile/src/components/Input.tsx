import {type TextInputProps} from 'react-native'
import styled from '@emotion/native'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import Image from './Image'

interface StylingProps {
  size?: 'normal' | 'small'
}

const RootContainer = styled.View<StylingProps>`
  background-color: #f2f2f2;
  padding: 16px;
  border-radius: 10px;
  margin: 0 -16px;
  flex-direction: row;
  align-items: center;

  ${(props) =>
    props.size === 'small' &&
    `
    padding: 9px;
  `}
`
const InputStyled = styled.TextInput<StylingProps>`
  font-size: 18px;
  font-family: '${(p) => p.theme.fonts.ttSatoshi500}';
  flex: 1;

  ${(props) =>
    props.size === 'small' &&
    `
    font-size: 16px;
  `}
`

const IconStyled = styled(Image)`
  margin-right: 8px;
`

export interface Props extends TextInputProps {
  icon?: SvgString
  size?: 'normal' | 'small'
}

function TextInput(props: Props): JSX.Element {
  const {style, size, icon, ...restProps} = props
  return (
    <RootContainer size={size} style={style}>
      {icon && <IconStyled source={icon} />}
      <InputStyled size={size} placeholderTextColor="#848484" {...restProps} />
    </RootContainer>
  )
}

export default TextInput
