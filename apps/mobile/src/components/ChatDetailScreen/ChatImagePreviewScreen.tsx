import {ImageZoom} from '@likashefqet/react-native-image-zoom'
import {
  IconButton,
  Share,
  useTheme,
  XmarkCancelClose,
  XStack,
} from '@vexl-next/ui'
import {shareAsync} from 'expo-sharing'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useStatusBarStyleForScreen} from '../../state/statusBarStyleAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {showErrorAlert} from '../ErrorAlert'

type Props = RootStackScreenProps<'ChatImagePreview'>

export default function ChatImagePreviewScreen({
  route: {
    params: {imageUri},
  },
}: Props): React.ReactElement {
  const {width, height} = useWindowDimensions()
  const {top} = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack()
  const theme = useTheme()
  const {t} = useTranslation()

  const shareImage = (): void => {
    shareAsync(imageUri).catch((error: unknown) => {
      showErrorAlert({title: t('common.somethingWentWrong'), error})
    })
  }

  useStatusBarStyleForScreen('secondary')

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Stack f={1} bc="$backgroundPrimary">
        <XStack
          pos="absolute"
          top={top}
          mt="$4"
          right="$4"
          gap="$3"
          zIndex={100}
        >
          <IconButton onPress={shareImage}>
            <Share color={theme.foregroundPrimary.get()} />
          </IconButton>
          <IconButton onPress={safeGoBack}>
            <XmarkCancelClose color={theme.foregroundPrimary.get()} />
          </IconButton>
        </XStack>
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
