import {createScope, molecule} from 'jotai-molecules'
import * as O from 'fp-ts/Option'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {atom} from 'jotai'
import {type FileSystemError} from '../../utils/internalStorage'
import {
  getImageFromCameraAndTryToResolveThePermissionsAlongTheWay,
  getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay,
  type ImagePickerError,
} from '../LoginFlow/components/PhotoScreen/utils'
import {translationAtom} from '../../utils/localization/I18nProvider'
import reportError from '../../utils/reportError'
import {Alert} from 'react-native'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'

export const ChangeProfilePictureScope = createScope<O.Option<UriString>>(
  O.none
)

export const changeProfilePictureMolecule = molecule(
  (getMolecule, getScope) => {
    const changeProfilePictureScope = getScope(ChangeProfilePictureScope)

    const reportAndTranslateErrorsAtom = atom<
      null,
      [{error: FileSystemError | ImagePickerError}],
      string
    >(null, (get, set, params) => {
      const {error} = params
      const {t} = get(translationAtom)

      if (error._tag === 'imagePickerError') {
        switch (error.reason) {
          case 'PermissionsNotGranted':
            return t('loginFlow.photo.permissionsNotGranted')
          case 'NothingSelected':
            return t('loginFlow.photo.nothingSelected')
        }
      }
      reportError('error', 'Unexpected error while picking image', error)
      return t('common.unknownError') // how is it that linter needs this line
    })

    const selectedImageUriAtom = atom<O.Option<UriString>>(
      changeProfilePictureScope
    )

    const didImageUriChangeAtom = atom<boolean>(false)

    const selectImageActionAtom = atom<null, [], O.Option<UriString>>(
      null,
      (get, set) => {
        const {t} = get(translationAtom)

        Alert.alert(t('loginFlow.photo.selectSource'), undefined, [
          {
            text: t('loginFlow.photo.gallery'),
            onPress: () => {
              void pipe(
                getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay(),
                TE.mapLeft((e) =>
                  set(reportAndTranslateErrorsAtom, {error: e})
                ),
                TE.match(Alert.alert, (r) => {
                  set(selectedImageUriAtom, O.some(r))
                  set(didImageUriChangeAtom, true)
                })
              )()
            },
          },
          {
            text: t('loginFlow.photo.camera'),
            onPress: () => {
              void pipe(
                getImageFromCameraAndTryToResolveThePermissionsAlongTheWay(),
                TE.mapLeft((e) =>
                  set(reportAndTranslateErrorsAtom, {error: e})
                ),
                TE.match(Alert.alert, (r) => {
                  set(selectedImageUriAtom, O.some(r))
                  set(didImageUriChangeAtom, true)
                })
              )()
            },
          },
          {
            text: t('common.cancel'),
          },
        ])

        return O.none
      }
    )

    return {
      didImageUriChangeAtom,
      selectedImageUriAtom,
      selectImageActionAtom,
    }
  }
)
