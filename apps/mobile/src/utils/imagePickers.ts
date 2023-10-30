import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as ImagePicker from 'expo-image-picker'
import {UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import * as FileSystem from 'expo-file-system'
import {pipe} from 'fp-ts/function'
import {safeParse} from './fpUtils'
import urlJoin from 'url-join'
import {generateUuid} from '@vexl-next/domain/dist/utility/Uuid.brand'
import {z} from 'zod'
import {PROFILE_PICTURE_DIRECTORY} from './fsDirectories'

export const SelectedImage = z.object({
  width: z.number().brand<'imageHeight'>(),
  height: z.number().brand<'imageWidth'>(),
  uri: UriString,
})
export type SelectedImage = z.TypeOf<typeof SelectedImage>

export interface ImagePickerError {
  _tag: 'imagePickerError'
  reason:
    | 'PermissionsNotGranted'
    | 'UnknownError'
    | 'NothingSelected'
    | 'FileError'
  error?: unknown
}

export function moveImageToInternalDirectory({
  imagePath,
  mode,
  directory,
}: {
  imagePath: UriString
  mode: 'cache' | 'documents'
  directory?: string
}): TE.TaskEither<ImagePickerError, UriString> {
  return TE.tryCatch(
    async (): Promise<UriString> => {
      const rootDirectory =
        mode === 'cache'
          ? FileSystem.cacheDirectory
          : FileSystem.documentDirectory
      if (!rootDirectory) throw new Error('document dir not found')

      const parentDirectory = directory
        ? urlJoin(rootDirectory, directory)
        : rootDirectory

      const dirInfo = await FileSystem.getInfoAsync(parentDirectory)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(parentDirectory, {
          intermediates: true,
        })
      }

      const path = UriString.parse(
        urlJoin(
          parentDirectory,
          `${generateUuid()}.${imagePath.split('.').at(-1) ?? 'jpeg'}`
        )
      )

      await FileSystem.copyAsync({from: imagePath, to: path})
      return path
    },
    (e) => ({_tag: 'imagePickerError', reason: 'FileError', error: e}) as const
  )
}

export function getImageFromCameraAndTryToResolveThePermissionsAlongTheWay({
  saveTo,
  aspect,
}: {
  saveTo: 'cache' | 'documents'
  aspect?: [number, number] | undefined
}): TE.TaskEither<ImagePickerError, SelectedImage> {
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
        aspect,
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

      return await pipe(
        moveImageToInternalDirectory({
          imagePath: UriString.parse(selectedImage.uri),
          mode: saveTo,
          directory: PROFILE_PICTURE_DIRECTORY,
        }),
        TE.chainEitherKW((uri) => {
          return safeParse(SelectedImage)({
            uri,
            width: selectedImage.width,
            height: selectedImage.height,
          })
        }),
        TE.mapLeft((error) => {
          if (error._tag === 'ParseError') {
            return {
              _tag: 'imagePickerError',
              reason: 'UnknownError',
              error,
            } as const
          }
          return error
        })
      )()
    } catch (error) {
      return E.left({_tag: 'imagePickerError', reason: 'UnknownError', error})
    }
  }
}

export function getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay({
  saveTo,
  aspect,
}: {
  saveTo: 'cache' | 'documents'
  aspect?: [number, number] | undefined
}): TE.TaskEither<ImagePickerError, SelectedImage> {
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
        aspect,
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

      return await pipe(
        moveImageToInternalDirectory({
          imagePath: UriString.parse(selectedImage.uri),
          mode: saveTo,
          directory: PROFILE_PICTURE_DIRECTORY,
        }),
        TE.chainEitherKW((uri) => {
          return safeParse(SelectedImage)({
            uri,
            width: selectedImage.width,
            height: selectedImage.height,
          })
        }),
        TE.mapLeft((error) => {
          if (error._tag === 'ParseError') {
            return {
              _tag: 'imagePickerError',
              reason: 'UnknownError',
              error,
            } as const
          }
          return error
        })
      )()
    } catch (error) {
      return E.left({_tag: 'imagePickerError', reason: 'UnknownError', error})
    }
  }
}
