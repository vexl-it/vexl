import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {pipe} from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {atom, type PrimitiveAtom} from 'jotai'
import {Alert} from 'react-native'
import {showErrorAlert} from '../components/ErrorAlert'
import {
  getImageFromCameraResolvePermissionsAndMoveItToInternalDirectory,
  getImageFromGalleryResolvePermissionsAndMoveItToInternalDirectory,
  type ImagePickerError,
} from '../utils/imagePickers'
import {type FileSystemError} from '../utils/internalStorage'
import {translationAtom} from '../utils/localization/I18nProvider'
import reportError from '../utils/reportError'

const reportAndTranslateErrorsAtom = atom<
  null,
  [{error: FileSystemError | ImagePickerError}],
  string
>(null, (get, set, params) => {
  const {error} = params
  const {t} = get(translationAtom)

  if (error._tag === 'ImagePickerError') {
    switch (error.reason) {
      case 'PermissionsNotGranted':
        return t('loginFlow.photo.permissionsNotGranted')
      case 'NothingSelected':
        return t('loginFlow.photo.nothingSelected')
    }
  }
  reportError('error', new Error('Unexpected error while picking image'), {
    error,
  })
  return t('common.somethingWentWrong') // how is it that linter needs this line
})

export const selectImageActionAtom = atom(
  null,
  (get, set, atomToSetOnSuccess: PrimitiveAtom<UriString | undefined>) => {
    const {t} = get(translationAtom)

    Alert.alert(t('loginFlow.photo.selectSource'), undefined, [
      {
        text: t('loginFlow.photo.gallery'),
        onPress: () => {
          void pipe(
            getImageFromGalleryResolvePermissionsAndMoveItToInternalDirectory({
              saveTo: 'documents',
              aspect: [1, 1],
            }),
            effectToTaskEither,
            TE.match(
              (e) => {
                if (
                  e._tag === 'ImagePickerError' &&
                  e.reason === 'NothingSelected'
                ) {
                  return O.none
                }

                showErrorAlert({
                  title: set(reportAndTranslateErrorsAtom, {error: e}),
                  error: e,
                })
                return O.none
              },
              (r) => {
                return O.some(r.uri)
              }
            ),
            T.map((uri) => {
              pipe(
                uri,
                O.match(
                  () => {
                    return false
                  },
                  (uri) => {
                    set(atomToSetOnSuccess, uri)
                    return true
                  }
                )
              )
            })
          )()
        },
      },
      {
        text: t('loginFlow.photo.camera'),
        onPress: () => {
          void pipe(
            getImageFromCameraResolvePermissionsAndMoveItToInternalDirectory({
              saveTo: 'documents',
              aspect: [1, 1],
            }),
            effectToTaskEither,
            TE.match(
              (e) => {
                showErrorAlert({
                  title: set(reportAndTranslateErrorsAtom, {error: e}),
                  error: e,
                })

                return O.none
              },
              (r) => {
                return O.some(r.uri)
                // set(didImageUriChangeAtom, true)
              }
            ),
            T.map((uri) => {
              pipe(
                uri,
                O.match(
                  () => {
                    return false
                  },
                  (uri) => {
                    set(atomToSetOnSuccess, uri)
                    return true
                  }
                )
              )
            })
          )()
        },
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ])

    return O.none
  }
)
