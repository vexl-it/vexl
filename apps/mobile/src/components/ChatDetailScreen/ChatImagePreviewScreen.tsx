import {ImageZoom} from '@likashefqet/react-native-image-zoom'
import {IconButton, XmarkCancelClose} from '@vexl-next/ui'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useStatusBarStyleForScreen} from '../../state/statusBarStyleAtom'
import useSafeGoBack from '../../utils/useSafeGoBack'

type Props = RootStackScreenProps<'ChatImagePreview'>

export default function ChatImagePreviewScreen({
  route: {
    params: {imageUri},
  },
}: Props): React.ReactElement {
  const {width, height} = useWindowDimensions()
  const {top} = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack()

  useStatusBarStyleForScreen('secondary')

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Stack f={1} bc="$backgroundPrimary">
        <Stack pos="absolute" top={top} mt="$4" right="$4" zIndex={100}>
          <IconButton onPress={safeGoBack}>
            <XmarkCancelClose />
          </IconButton>
        </Stack>
        <Stack f={1} ai="center" jc="center">
          <ImageZoom
            imageContainerStyle={{flex: 1}}
            containerStyle={{flex: 1}}
            style={{width, height}}
            uri={imageUri}
            minScale={1}
            maxScale={3}
          />
        </Stack>
      </Stack>
    </GestureHandlerRootView>
  )
}
