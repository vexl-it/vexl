import {type ViewStyle, type StyleProp} from 'react-native'
import {type ReactNode} from 'react'
import {Stack, styled} from 'tamagui'

interface Props {
  centered?: boolean
  noPadding?: boolean
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

const WhiteContainerStyled = styled(Stack, {
  f: 1,
  br: '$5',
  bg: '$white',
  variants: {
    noPadding: {
      true: {
        p: '$0',
      },
      false: {
        p: '$5',
      },
    },
  } as const,
})
function WhiteContainer({
  noPadding = false,
  style,
  children,
}: Props): JSX.Element {
  return (
    <WhiteContainerStyled noPadding={noPadding} style={style}>
      {children}
    </WhiteContainerStyled>
  )
}

export default WhiteContainer
