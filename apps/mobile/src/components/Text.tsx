import {type TextProps} from 'react-native'
import styled from '@emotion/native'

type ColorStyle =
  | 'white'
  | 'black'
  | 'grayOnBlack'
  | 'gray'
  | 'grayOnWhite'
  | 'red'

export interface Props extends TextProps {
  colorStyle?: ColorStyle | undefined
  fontWeight?: 400 | 500 | 600 | 700
}

const TextStyled = styled.Text<Props>`
  color: ${(p) => {
    if (p.colorStyle === 'grayOnBlack' || p.colorStyle === 'gray')
      return p.theme.colors.grayOnBlack
    if (p.colorStyle === 'grayOnWhite') return p.theme.colors.grayOnWhite
    if (p.colorStyle === 'red') return p.theme.colors.red
    return p.colorStyle ?? 'black'
  }};
  font-family: '${(p) => {
    if (p.fontWeight === 400) return p.theme.fonts.ttSatoshi400
    if (p.fontWeight === 500) return p.theme.fonts.ttSatoshi500
    if (p.fontWeight === 600) return p.theme.fonts.ttSatoshi600
    if (p.fontWeight === 700) return p.theme.fonts.ttSatoshi700
    return p.theme.fonts.ttSatoshi500
  }}';

  font-size: 18px;
`

function Text(props: Props): JSX.Element {
  return <TextStyled {...props} style={props.style} />
}

const TitleStyled = styled(Text)`
  font-family: ${(p) => p.theme.fonts.ppMonument};
  font-size: 24px;
`
function TitleText(props: TextProps & {colorStyle?: ColorStyle}): JSX.Element {
  return <TitleStyled {...props} style={props.style} />
}

export default Text

export {TitleText}
