// Todo branded type
import * as E from 'fp-ts/Either'
import * as ImagePicker from 'expo-image-picker'
import {UriString} from '@vexl-next/domain/dist/utility/UriString.brand'

// Todo proper branded type
export async function getImageFromCamera(): Promise<
  E.Either<
    'PermissionsNotGranted' | 'UnknownError' | 'NothingSelected',
    UriString
  >
> {
  try {
    const cameraPermissions = await ImagePicker.requestCameraPermissionsAsync()
    if (!cameraPermissions.granted && cameraPermissions.canAskAgain) {
      return E.left('PermissionsNotGranted')
    }
    if (!cameraPermissions.granted) {
      const permissionsResult = await ImagePicker.getCameraPermissionsAsync()
      if (!permissionsResult.granted) return E.left('PermissionsNotGranted')
    }
    const {assets, canceled} = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    })

    if (canceled) return E.left('NothingSelected')
    const selectedImage = assets?.[0]

    if (!selectedImage?.base64) return E.left('UnknownError')

    return E.right(
      UriString.parse('data:image/jpeg;base64,' + selectedImage.base64)
    )
  } catch (error) {
    console.error('Error while selecting image from camera', error)
    return E.left('UnknownError')
  }
}

export async function getImageFromGallery(): Promise<
  E.Either<
    'PermissionsNotGranted' | 'UnknownError' | 'NothingSelected',
    UriString
  >
> {
  try {
    const libraryPermissions =
      await ImagePicker.getMediaLibraryPermissionsAsync(true)
    if (!libraryPermissions.granted && !libraryPermissions.canAskAgain) {
      return E.left('PermissionsNotGranted')
    }
    if (!libraryPermissions.granted) {
      const permissionsResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permissionsResult.granted) return E.left('PermissionsNotGranted')
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    })

    if (result.canceled) return E.left('NothingSelected')
    const selectedImage = result.assets?.[0]

    if (!selectedImage?.base64) return E.left('UnknownError')
    return E.right(
      UriString.parse('data:image/jpeg;base64,' + selectedImage.base64)
    )
  } catch (error) {
    console.error('Error while selecting image from gallery', error)
    return E.left('UnknownError')
  }
}
