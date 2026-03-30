import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Camera, IconButton as UiIconButton} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Alert} from 'react-native'
import {useTheme} from 'tamagui'
import {getImageFromGalleryResolvePermissionsAndMoveItToInternalDirectory} from '../../../utils/imagePickers'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {showErrorAlert} from '../../ErrorAlert'
import {chatMolecule} from '../atoms'

function SendImageButton(): React.ReactElement {
  const theme = useTheme()
  const {selectedImageAtom} = useMolecule(chatMolecule)
  const setSelectedImage = useSetAtom(selectedImageAtom)
  const {t} = useTranslation()

  const selectImage = useCallback(
    () =>
      pipe(
        getImageFromGalleryResolvePermissionsAndMoveItToInternalDirectory({
          saveTo: 'cache',
          aspect: undefined,
        }),
        effectToTaskEither,
        TE.map((uri) => {
          setSelectedImage(uri)
        }),
        TE.mapLeft((e) => {
          if (e.reason === 'PermissionsNotGranted') {
            Alert.alert(
              t('messages.unableToSelectImageToSend.title'),
              t('messages.unableToSelectImageToSend.missingPermissions')
            )
          } else {
            showErrorAlert({
              title: t('messages.unableToSelectImageToSend.title'),
              description: t('common.somethingWentWrongDescription'),
              error: e,
            })
          }
        })
      ),
    [setSelectedImage, t]
  )

  return (
    <UiIconButton
      width="$10"
      height="$10"
      borderRadius="$3"
      backgroundColor="$backgroundSecondary"
      onPress={() => {
        void selectImage()()
      }}
    >
      <Camera size={20} color={theme.foregroundPrimary.val} />
    </UiIconButton>
  )
}

export default SendImageButton
