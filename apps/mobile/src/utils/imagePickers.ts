import {
  UriString,
  UriStringE,
} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Effect, Schema} from 'effect'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import {PROFILE_PICTURE_DIRECTORY} from './fsDirectories'

export const SelectedImage = Schema.Struct({
  width: Schema.Number.pipe(Schema.brand('imageWidth')),
  height: Schema.Number.pipe(Schema.brand('imageHeight')),
  uri: UriStringE,
})
export type SelectedImage = typeof SelectedImage.Type

export class ImagePickerError extends Schema.TaggedError<ImagePickerError>(
  'ImagePickerError'
)('ImagePickerError', {
  reason: Schema.Literal(
    'PermissionsNotGranted',
    'UnknownError',
    'NothingSelected',
    'FileError'
  ),
  error: Schema.optional(Schema.Unknown),
}) {}

export function moveImageToInternalDirectory({
  imagePath,
  mode,
  directory,
}: {
  imagePath: UriString
  mode: 'cache' | 'documents'
  directory?: string
}): Effect.Effect<UriString, ImagePickerError> {
  return Effect.tryPromise({
    try: async () => {
      const rootDirectory =
        mode === 'cache'
          ? FileSystem.cacheDirectory
          : FileSystem.documentDirectory
      if (!rootDirectory) throw new Error('document dir not found')

      const parentDirectory = directory
        ? `${rootDirectory}${directory}`
        : rootDirectory

      const dirInfo = await FileSystem.getInfoAsync(parentDirectory)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(parentDirectory, {
          intermediates: true,
        })
      }

      const path = `${parentDirectory}${generateUuid()}.${imagePath.split('.').at(-1) ?? 'jpeg'}`

      await FileSystem.copyAsync({from: imagePath, to: path})
      const infoTo = await FileSystem.getInfoAsync(imagePath)
      return Schema.decodeSync(UriStringE)(infoTo.uri)
    },
    catch(error) {
      return new ImagePickerError({reason: 'FileError', error})
    },
  })
}

export function getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay({
  aspect,
}: {
  aspect?: [number, number] | undefined
}): Effect.Effect<SelectedImage, ImagePickerError> {
  return Effect.tryPromise(async () => {
    const libraryPermissions =
      await ImagePicker.getMediaLibraryPermissionsAsync()

    if (!libraryPermissions.granted && !libraryPermissions.canAskAgain) {
      return Effect.fail(
        new ImagePickerError({
          reason: 'PermissionsNotGranted',
        })
      )
    }

    if (!libraryPermissions.granted) {
      const permissionsResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permissionsResult.granted)
        return Effect.fail(
          new ImagePickerError({
            reason: 'PermissionsNotGranted',
          })
        )
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 1,
      base64: true,
      allowsMultipleSelection: false,
    })

    if (result.canceled)
      return Effect.fail(new ImagePickerError({reason: 'NothingSelected'}))

    const selectedImage = result.assets?.[0]

    if (!selectedImage?.uri)
      return Effect.fail(
        new ImagePickerError({
          reason: 'UnknownError',
          error: new Error('Uri of the selected image is null'),
        })
      )

    return Effect.succeed(
      Schema.decodeSync(SelectedImage)({
        uri: Schema.decodeSync(UriStringE)(selectedImage.uri),
        width: selectedImage.width,
        height: selectedImage.height,
      })
    )
  }).pipe(
    Effect.catchTag('UnknownException', (e) =>
      Effect.fail(
        new ImagePickerError({
          reason: 'UnknownError',
          error: new Error('Unknown error when selecting image'),
        })
      )
    ),
    Effect.flatten
  )
}

export function getImageFromCameraAndTryToResolveThePermissionsAlongTheWay({
  aspect,
}: {
  aspect?: [number, number] | undefined
}): Effect.Effect<SelectedImage, ImagePickerError> {
  return Effect.tryPromise(async () => {
    const cameraPermissions = await ImagePicker.requestCameraPermissionsAsync()

    if (!cameraPermissions.granted && !cameraPermissions.canAskAgain) {
      return Effect.fail(
        new ImagePickerError({
          reason: 'PermissionsNotGranted',
        })
      )
    }

    if (!cameraPermissions.granted) {
      const permissionsResult = await ImagePicker.getCameraPermissionsAsync()
      if (!permissionsResult.granted)
        return Effect.fail(
          new ImagePickerError({
            reason: 'PermissionsNotGranted',
          })
        )
    }

    const {assets, canceled} = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 1,
      allowsMultipleSelection: false,
    })

    if (canceled)
      return Effect.fail(new ImagePickerError({reason: 'NothingSelected'}))
    const selectedImage = assets?.[0]

    if (!selectedImage?.uri)
      return Effect.fail(
        new ImagePickerError({
          reason: 'UnknownError',
          error: new Error('Uri of the selected image is null'),
        })
      )

    return Effect.succeed(
      Schema.decodeSync(SelectedImage)({
        uri: Schema.decodeSync(UriStringE)(selectedImage.uri),
        width: selectedImage.width,
        height: selectedImage.height,
      })
    )
  }).pipe(
    Effect.catchTag('UnknownException', (e) =>
      Effect.fail(
        new ImagePickerError({
          reason: 'UnknownError',
          error: new Error('Unknown error when selecting image'),
        })
      )
    ),
    Effect.flatten
  )
}

export function getImageFromCameraResolvePermissionsAndMoveItToInternalDirectory({
  saveTo,
  aspect,
}: {
  saveTo: 'cache' | 'documents'
  aspect?: [number, number] | undefined
}): Effect.Effect<SelectedImage, ImagePickerError> {
  return Effect.gen(function* (_) {
    const selectedImage = yield* _(
      getImageFromCameraAndTryToResolveThePermissionsAlongTheWay({
        aspect,
      })
    )

    const path = yield* _(
      moveImageToInternalDirectory({
        imagePath: UriString.parse(selectedImage.uri),
        mode: saveTo,
        directory: PROFILE_PICTURE_DIRECTORY,
      })
    )

    return {
      ...selectedImage,
      uri: path,
    }
  })
}

export function getImageFromGalleryResolvePermissionsAndMoveItToInternalDirectory({
  saveTo,
  aspect,
}: {
  saveTo: 'cache' | 'documents'
  aspect?: [number, number] | undefined
}): Effect.Effect<SelectedImage, ImagePickerError> {
  return Effect.gen(function* (_) {
    const selectedImage = yield* _(
      getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay({
        aspect,
      })
    )

    const path = yield* _(
      moveImageToInternalDirectory({
        imagePath: UriString.parse(selectedImage.uri),
        mode: saveTo,
        directory: PROFILE_PICTURE_DIRECTORY,
      })
    )

    return {
      ...selectedImage,
      uri: path,
    }
  })
}
