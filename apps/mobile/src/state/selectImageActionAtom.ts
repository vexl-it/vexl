import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Option, pipe} from 'effect'
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
          void Effect.runPromise(
            getImageFromGalleryResolvePermissionsAndMoveItToInternalDirectory({
              saveTo: 'documents',
              aspect: [1, 1],
            }).pipe(
              Effect.match({
                onFailure: (e) => {
                  if (
                    e._tag === 'ImagePickerError' &&
                    e.reason === 'NothingSelected'
                  ) {
                    return Option.none<UriString>()
                  }

                  showErrorAlert({
                    title: set(reportAndTranslateErrorsAtom, {error: e}),
                    error: e,
                  })
                  return Option.none<UriString>()
                },
                onSuccess: (r) => {
                  return Option.some(r.uri)
                },
              }),
              Effect.map((uri) => {
                pipe(
                  uri,
                  Option.match({
                    onNone: () => {
                      return false
                    },
                    onSome: (uri) => {
                      set(atomToSetOnSuccess, uri)
                      return true
                    },
                  })
                )
              })
            )
          )
        },
      },
      {
        text: t('loginFlow.photo.camera'),
        onPress: () => {
          void Effect.runPromise(
            getImageFromCameraResolvePermissionsAndMoveItToInternalDirectory({
              saveTo: 'documents',
              aspect: [1, 1],
            }).pipe(
              Effect.match({
                onFailure: (e) => {
                  showErrorAlert({
                    title: set(reportAndTranslateErrorsAtom, {error: e}),
                    error: e,
                  })

                  return Option.none<UriString>()
                },
                onSuccess: (r) => {
                  return Option.some(r.uri)
                  // set(didImageUriChangeAtom, true)
                },
              }),
              Effect.map((uri) => {
                pipe(
                  uri,
                  Option.match({
                    onNone: () => {
                      return false
                    },
                    onSome: (uri) => {
                      set(atomToSetOnSuccess, uri)
                      return true
                    },
                  })
                )
              })
            )
          )
        },
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ])

    return Option.none()
  }
)
