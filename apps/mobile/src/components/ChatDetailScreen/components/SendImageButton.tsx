import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {useMolecule} from 'bunshi/dist/react'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Alert} from 'react-native'
import {getTokens} from 'tamagui'
import {getImageFromGalleryResolvePermissionsAndMoveItToInternalDirectory} from '../../../utils/imagePickers'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../utils/showErrorAlert'
import IconButton from '../../IconButton'
import {chatMolecule} from '../atoms'
import cameraSvg from '../images/cameraSvg'

function SendImageButton(): JSX.Element {
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
              subtitle: t('common.unknownError'),
              error: e,
            })
          }
        })
      ),
    [setSelectedImage, t]
  )

  return (
    <IconButton
      width={getTokens().space[10].val}
      height={getTokens().space[10].val}
      borderRadius={Math.round(getTokens().space[10].val / 2)}
      oval={true}
      icon={cameraSvg}
      onPress={() => {
        void selectImage()()
      }}
    />
  )
}

export default SendImageButton
