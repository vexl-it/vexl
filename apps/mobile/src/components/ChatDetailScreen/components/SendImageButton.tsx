import IconButton from '../../IconButton'
import cameraSvg from '../images/cameraSvg'
import {getTokens} from 'tamagui'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay} from '../../../utils/imagePickers'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {Alert} from 'react-native'

function SendImageButton(): JSX.Element {
  const {selectedImageAtom} = useMolecule(chatMolecule)
  const setSelectedImage = useSetAtom(selectedImageAtom)
  const {t} = useTranslation()

  const selectImage = useCallback(
    () =>
      pipe(
        getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay({
          saveTo: 'cache',
          aspect: undefined,
        }),
        TE.map((uri) => {
          setSelectedImage(uri)
        }),
        TE.mapLeft((e) => {
          Alert.alert(
            t('messages.unableToSelectImageToSend.title'),
            e.reason === 'PermissionsNotGranted'
              ? t('messages.unableToSelectImageToSend.missingPermissions')
              : t('common.unknownError')
          )
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
