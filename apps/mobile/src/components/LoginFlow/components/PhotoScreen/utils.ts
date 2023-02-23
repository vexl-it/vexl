// Todo branded type
import * as E from 'fp-ts/Either'
import type * as T from 'fp-ts/Task'
import * as ImagePicker from 'expo-image-picker'
import {UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {pipe} from 'fp-ts/function'
import {fsSafeParseE} from '../../../../utils/fsUtils'

export interface ImagePickerError {
  _tag: 'imagePickerError'
  reason: 'PermissionsNotGranted' | 'UnknownError' | 'NothingSelected'
  error?: unknown
}

export function getImageFromCameraAndTryToResolveThePermissionsAlongTheWay(): T.Task<
  E.Either<ImagePickerError, UriString>
> {
  return async () => {
    try {
      const cameraPermissions =
        await ImagePicker.requestCameraPermissionsAsync()
      if (!cameraPermissions.granted && cameraPermissions.canAskAgain) {
        return E.left({
          _tag: 'imagePickerError',
          reason: 'PermissionsNotGranted',
        })
      }
      if (!cameraPermissions.granted) {
        const permissionsResult = await ImagePicker.getCameraPermissionsAsync()
        if (!permissionsResult.granted)
          return E.left({
            _tag: 'imagePickerError',
            reason: 'PermissionsNotGranted',
          })
      }
      const {assets, canceled} = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        allowsMultipleSelection: false,
      })

      if (canceled)
        return E.left({_tag: 'imagePickerError', reason: 'NothingSelected'})
      const selectedImage = assets?.[0]

      if (!selectedImage?.uri)
        return E.left({
          _tag: 'imagePickerError',
          reason: 'UnknownError',
          error: new Error('Uri of the selected image is null'),
        })

      return pipe(
        fsSafeParseE(UriString)(selectedImage.uri),
        E.mapLeft((error) => ({
          _tag: 'imagePickerError',
          reason: 'UnknownError',
          error,
        }))
      )
    } catch (error) {
      return E.left({_tag: 'imagePickerError', reason: 'UnknownError', error})
    }
  }
}

export function getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay(): T.Task<
  E.Either<ImagePickerError, UriString>
> {
  return async () => {
    try {
      const libraryPermissions =
        await ImagePicker.getMediaLibraryPermissionsAsync(true)
      if (!libraryPermissions.granted && !libraryPermissions.canAskAgain) {
        return E.left({
          _tag: 'imagePickerError',
          reason: 'PermissionsNotGranted',
        })
      }
      if (!libraryPermissions.granted) {
        const permissionsResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permissionsResult.granted)
          return E.left({
            _tag: 'imagePickerError',
            reason: 'PermissionsNotGranted',
          })
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: true,
        allowsMultipleSelection: false,
      })

      if (result.canceled)
        return E.left({_tag: 'imagePickerError', reason: 'NothingSelected'})
      const selectedImage = result.assets?.[0]

      if (!selectedImage?.uri)
        return E.left({
          _tag: 'imagePickerError',
          reason: 'UnknownError',
          error: new Error('Uri of the selected image is null'),
        })

      return pipe(
        fsSafeParseE(UriString)(selectedImage.uri),
        E.mapLeft((error) => ({
          _tag: 'imagePickerError',
          reason: 'UnknownError',
          error,
        }))
      )
    } catch (error) {
      return E.left({_tag: 'imagePickerError', reason: 'UnknownError', error})
    }
  }
}
