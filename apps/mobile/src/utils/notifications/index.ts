import notifee, {AuthorizationStatus} from '@notifee/react-native'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import type * as T from 'fp-ts/lib/Task'
import {Alert} from 'react-native'
import NotificationSetting from 'react-native-open-notification'
import messaging from '@react-native-firebase/messaging'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'

type UnknownErrorNotifications = BasicError<'UnknownErrorNotifications'>

export function requestNotificationPermissions(): TE.TaskEither<
  UnknownErrorNotifications,
  'granted' | 'deniedWithoutAction' | 'deniedOpenedSettings'
> {
  return async () =>
    await new Promise((resolve) => {
      notifee
        .requestPermission()
        .then((result) => {
          if (result.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
            resolve(E.right('granted' as const))
            return
          }

          Alert.alert(
            // TODO translate
            'Notifications not granted',
            'You can enable them in the settings',
            [
              {
                text: 'Open settings',
                onPress: () => {
                  NotificationSetting.open()
                  resolve(E.right('deniedOpenedSettings' as const))
                },
              },
              {
                'text': 'Cancel',
                style: 'cancel',
                onPress: () => {
                  resolve(E.right('deniedWithoutAction' as const))
                },
              },
            ]
          )
        })
        .catch((e) => {
          resolve(
            E.left({
              _tag: 'UnknownErrorNotifications',
              error: new Error('Error requesting permissions', {cause: e}),
            } as const)
          )
        })
    })
}

export function getNotificationToken(): T.Task<string | null> {
  return async () => {
    try {
      return await messaging().getToken()
    } catch (e) {
      return null
    }
  }
}

export interface NotificationsEnabledSettings {
  readonly notifications: boolean
  readonly backgroundTasks: boolean
}

export function areNotificationsEnabled(): TE.TaskEither<
  any,
  NotificationsEnabledSettings
> {
  return TE.tryCatch(
    async () => {
      const settings = await notifee.getNotificationSettings()

      return {
        notifications:
          settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
        backgroundTasks: true, // TODO how to find this out on IOS?
      }
    },
    () => 'error'
  )
}
