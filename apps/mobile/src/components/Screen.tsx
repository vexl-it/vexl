import styled from '@emotion/native'
import {
  type EdgeInsets,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {type Color} from '../utils/ThemeProvider/defaultTheme'

interface Props {
  backgroundColor?: Color
  children: JSX.Element | JSX.Element[]
  customHorizontalPadding?: number
  customVerticalPadding?: number
}

interface ContainerProps
  extends Required<
    Pick<
      Props,
      'backgroundColor' | 'customHorizontalPadding' | 'customVerticalPadding'
    >
  > {
  insets: EdgeInsets
}

const Container = styled.View<ContainerProps>`
  flex: 1;
  padding-top: ${(p) =>
    String(Math.max(p.insets.top, p.customVerticalPadding))}px;
  padding-bottom: ${(p) =>
    String(Math.max(p.insets.bottom, p.customVerticalPadding))}px;
  padding-right: ${(p) =>
    String(Math.max(p.insets.right, p.customHorizontalPadding))}px;
  padding-left: ${(p) =>
    String(Math.max(p.insets.left, p.customHorizontalPadding))}px;
  background-color: ${(p) => p.theme.colors[p.backgroundColor]};
`
function Screen({
  backgroundColor = 'black',
  children,
  customHorizontalPadding = 0,
  customVerticalPadding = 0,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets()
  return (
    <Container
      backgroundColor={backgroundColor}
      customHorizontalPadding={customHorizontalPadding}
      customVerticalPadding={customVerticalPadding}
      insets={insets}
    >
      {children}
    </Container>
  )
}

export default Screen
