import React, {type ComponentProps} from 'react'
import {Stack, Text} from 'tamagui'
import Image from '../Image'
import loaderSvg from './image/loaderSvg'

interface Props {
  text: string
  style?: ComponentProps<typeof Stack>['style']
}

function LoaderView({text, style}: Props): React.ReactElement {
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
