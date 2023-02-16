import {type ViewStyle, type StyleProp} from 'react-native'
import {type ReactNode} from 'react'
import styled from '@emotion/native'

interface Props {
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

const WhiteContainerStyled = styled.View`
  background-color: ${(p) => p.theme.colors.backgroundWhite};
  flex: 1;
  padding: 24px;
  border-radius: 13px;
`
function WhiteContainer({style, children}: Props): JSX.Element {
  return <WhiteContainerStyled style={style}>{children}</WhiteContainerStyled>
}

export default WhiteContainer
