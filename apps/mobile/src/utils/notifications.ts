import * as Device from 'expo-device'
import type * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as Notifications from 'expo-notifications'

export interface NotificationPermissionUnknownError {
  readonly _tag: 'notificationPermissionUnknownError'
  readonly error: unknown
}

export interface NotificationsNotAvailableOnEmulator {
  readonly _tag: 'notificationsNotAvailableOnEmulator'
}

export interface NotificationPermissionDenied {
  readonly _tag: 'notificationPermissionDenied'
}

export function getNotificationToken({
  shouldAskForPermissions,
}: {
  shouldAskForPermissions: boolean
}): TE.TaskEither<
  | NotificationPermissionUnknownError
  | NotificationsNotAvailableOnEmulator
  | NotificationPermissionDenied,
  string
> {
  return async () => {
    try {
      if (!Device.isDevice)
        return E.left({_tag: 'notificationsNotAvailableOnEmulator'} as const)

      let permissionStatus = await Notifications.getPermissionsAsync()
      if (
        !permissionStatus.granted &&
        shouldAskForPermissions &&
        permissionStatus.canAskAgain
      ) {
        permissionStatus = await Notifications.requestPermissionsAsync()
      }

      if (permissionStatus.granted) {
        const token = await Notifications.getExpoPushTokenAsync()
        return E.right(token.data)
      }

      return E.left({_tag: 'notificationPermissionDenied'} as const)
    } catch (e) {
      return E.left({
        _tag: 'notificationPermissionUnknownError',
        error: e,
      } as const)
    }
  }
}
