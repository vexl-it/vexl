import {Effect, Schema} from 'effect'
import {Camera} from 'expo-camera'
import {atom} from 'jotai'
import {Alert, Linking} from 'react-native'
import {translationAtom} from './localization/I18nProvider'
import reportError from './reportError'

export class CameraPermissionsNotGrantedError extends Schema.TaggedError<CameraPermissionsNotGrantedError>(
  'CameraPermissionsNotGrantedError'
)('CameraPermissionsNotGrantedError', {}) {}

export class UnknownCameraError extends Schema.TaggedError<UnknownCameraError>(
  'UnknownCameraError'
)('UnknownCameraError', {}) {}

export const handleCameraPermissionsActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return Effect.tryPromise({
    try: async () => await Camera.requestCameraPermissionsAsync(),
    catch: () => new UnknownCameraError({}),
  }).pipe(
    Effect.flatMap((permissionResponse) => {
      if (!permissionResponse.canAskAgain) {
        Alert.alert('', t('qrScanner.grantPermissionsInSettings'), [
          {
            text: t('qrScanner.openSettings'),
            onPress: () => {
              void Linking.openSettings()
            },
          },
          {
            text: t('common.cancel'),
          },
        ])
        return Effect.fail(new CameraPermissionsNotGrantedError({}))
      }
      if (permissionResponse.status === 'granted') {
        return Effect.succeed({})
      }

      return Effect.fail(new CameraPermissionsNotGrantedError({}))
    }),
    Effect.match({
      onSuccess: () => 'granted',
      onFailure: (e) => {
        if (e._tag === 'UnknownCameraError') {
          reportError(
            'error',
            new Error(
              'Unknown error when getting camera access, check library'
            ),
            {e}
          )
        }

        return 'denied'
      },
    })
  )
})
