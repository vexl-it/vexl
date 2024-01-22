import {type StyleProp, type ViewStyle} from 'react-native'
import {Stack, Text} from 'tamagui'
import Image from '../Image'
import loaderSvg from './image/loaderSvg'

interface Props {
  text: string
  style?: StyleProp<ViewStyle>
}

function LoaderView({text, style}: Props): JSX.Element {
  return (
    <Stack f={1} ai="center" jc="center" bg="$backgroundBlack" style={style}>
      <Image source={loaderSvg}></Image>
      <Text ff="$heading" fos={18} ta="center" col="$white">
        {text}
      </Text>
    </Stack>
  )
}

export default LoaderView
