import {ImageZoom} from '@likashefqet/react-native-image-zoom'
import {useMolecule} from 'bunshi/dist/react'
import * as Sharing from 'expo-sharing'
import {useAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Modal, Platform, useWindowDimensions} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {type GestureHandlerRootViewProps} from 'react-native-gesture-handler/lib/typescript/components/GestureHandlerRootView'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {showErrorAlert} from '../../ErrorAlert'
import IconButton from '../../IconButton'
import closeSvg from '../../images/closeSvg'
import {chatMolecule} from '../atoms'
import shareAndroidSvg from '../images/shareAndroidSvg'
import shareIosSvg from '../images/shareIosSvg'

const ZoomedImage = (
  props: GestureHandlerRootViewProps
): React.ReactElement => {
  const {t} = useTranslation()
  const {width} = useWindowDimensions()
  const {bottom, top, right, left} = useSafeAreaInsets()
  const {openedImageUriAtom} = useMolecule(chatMolecule)
  const [openedImageUri, setOpenedImageUri] = useAtom(openedImageUriAtom)

  const shareImage = useCallback(async () => {
    try {
      if (openedImageUri) {
        await Sharing.shareAsync(openedImageUri)
      }
    } catch (err) {
      showErrorAlert({
        title: t('common.unableToShareImage'),
        error: err,
      })
    }
  }, [openedImageUri, t])

  return (
    <GestureHandlerRootView {...props}>
      <Stack
        f={1}
        pt={top}
        pb={bottom}
        pl={left}
        pr={right}
        jc="center"
        ai="center"
        bc="rgba(0,0,0,0.8)"
      >
        <XStack
          pos="absolute"
          ai="center"
          gap="$2"
          top={top}
          right="$4"
          zIndex="$100"
        >
          {!!openedImageUri && (
            <IconButton
              icon={Platform.OS === 'ios' ? shareIosSvg : shareAndroidSvg}
              onPress={() => {
                void shareImage()
              }}
            />
          )}
          <IconButton
            icon={closeSvg}
            onPress={() => {
              setOpenedImageUri(undefined)
            }}
          />
        </XStack>
        <Stack f={1}>
          {!!openedImageUri && (
            <ImageZoom
              imageContainerStyle={{flex: 1}}
              containerStyle={{flex: 1}}
              style={{
                width: width * 0.9,
              }}
              uri={openedImageUri}
              minScale={0.5}
              maxScale={3}
            />
          )}
        </Stack>
      </Stack>
    </GestureHandlerRootView>
  )
}

function ImageZoomOverlay(): React.ReactElement {
  const {openedImageUriAtom} = useMolecule(chatMolecule)
  const [openedImageUri, setOpenedImageUri] = useAtom(openedImageUriAtom)

  const onDismiss = useCallback(() => {
    setOpenedImageUri(undefined)
  }, [setOpenedImageUri])

  return (
    <Modal
      onDismiss={onDismiss}
      onRequestClose={onDismiss}
      transparent
      animationType="fade"
      visible={!!openedImageUri}
    >
      <ZoomedImage />
    </Modal>
  )
}

export default ImageZoomOverlay
