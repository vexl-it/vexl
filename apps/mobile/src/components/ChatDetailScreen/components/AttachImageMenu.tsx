import {
  Camera,
  ImagePhoto,
  POPOVER_MENU_ITEM_HEIGHT,
  POPOVER_MENU_PADDING,
  PopoverMenu,
  PopoverMenuItem,
  Stack,
  tokens,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Effect} from 'effect'
import {useAtom} from 'jotai'
import React, {useCallback} from 'react'
import {StyleSheet} from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {
  getImageFromCameraAndTryToResolveThePermissionsAlongTheWay,
  getImagesFromGalleryAndTryToResolveThePermissionsAlongTheWay,
  type ImagePickerError,
  type SelectedImage,
} from '../../../utils/imagePickers'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {showErrorAlert} from '../../ErrorAlert'
import {chatMolecule} from '../atoms'
import {ChatOverlayScrim, useChatOverlayTransition} from './ChatOverlay'

export const MAX_SELECTED_IMAGES = 10

const GAP = tokens.space[3].val
const MENU_WIDTH = tokens.size[13].val * 2.5
const MENU_HEIGHT = POPOVER_MENU_ITEM_HEIGHT * 2 + POPOVER_MENU_PADDING * 2

function AttachImageMenu(): React.ReactElement | null {
  const {t} = useTranslation()
  const {attachImageMenuAnchorAtom, selectedImagesAtom} =
    useMolecule(chatMolecule)
  const [anchor, setAnchor] = useAtom(attachImageMenuAnchorAtom)
  const [selectedImages, setSelectedImages] = useAtom(selectedImagesAtom)

  const clearAnchor = useCallback(() => {
    setAnchor(null)
  }, [setAnchor])

  const {progress, close} = useChatOverlayTransition({
    isOpen: !!anchor,
    onClosed: clearAnchor,
  })

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{scale: interpolate(progress.value, [0, 1], [0.8, 1])}],
  }))

  if (!anchor) return null

  const pickImages = (
    pick: Effect.Effect<readonly SelectedImage[], ImagePickerError>
  ): void => {
    close()
    void pick.pipe(
      Effect.match({
        onSuccess: (images) => {
          setSelectedImages((previous) =>
            Array.take(Array.appendAll(previous, images), MAX_SELECTED_IMAGES)
          )
        },
        onFailure: (e) => {
          if (e.reason === 'NothingSelected') return
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            description:
              toCommonErrorMessage(e, t) ??
              t('common.somethingWentWrongDescription'),
            error: e,
          })
        },
      }),
      Effect.runPromise
    )
  }

  return (
    <Stack style={StyleSheet.absoluteFill}>
      <ChatOverlayScrim progress={progress} onPress={close} />
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            top: anchor.y - GAP - MENU_HEIGHT,
            left: anchor.x,
            width: MENU_WIDTH,
            transformOrigin: 'left bottom',
          },
          menuStyle,
        ]}
      >
        <PopoverMenu>
          <PopoverMenuItem
            icon={Camera}
            label={t('loginFlow.photo.camera')}
            onPress={() => {
              pickImages(
                getImageFromCameraAndTryToResolveThePermissionsAlongTheWay(
                  {}
                ).pipe(Effect.map(Array.of))
              )
            }}
          />
          <PopoverMenuItem
            icon={ImagePhoto}
            label={t('loginFlow.photo.gallery')}
            onPress={() => {
              pickImages(
                getImagesFromGalleryAndTryToResolveThePermissionsAlongTheWay({
                  selectionLimit: MAX_SELECTED_IMAGES - selectedImages.length,
                })
              )
            }}
          />
        </PopoverMenu>
      </Reanimated.View>
    </Stack>
  )
}

export default AttachImageMenu
