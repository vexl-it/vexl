import styled from '@emotion/native'
import Image from '../Image'
import loaderSvg from './image/loaderSvg'
import {TitleText} from '../Text'
import {type StyleProp, type ViewStyle} from 'react-native'

const ContainerStyled = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`

const LoaderImage = styled(Image)``
const TextStyled = styled(TitleText)`
  font-size: 18px;
  text-align: center;
`

interface Props {
  text: string
  style?: StyleProp<ViewStyle>
}

function LoaderView({text, style}: Props): JSX.Element {
  return (
    <ContainerStyled style={style}>
      <LoaderImage source={loaderSvg}></LoaderImage>
      <TextStyled colorStyle="white">{text}</TextStyled>
    </ContainerStyled>
  )
}

export default LoaderView
