import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import type * as T from 'fp-ts/lib/Task'
import {Alert} from 'react-native'
import NotificationSetting from 'react-native-open-notification'
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {
  type BasicError,
  toBasicError,
} from '@vexl-next/domain/dist/utility/errors'
import {useTranslation} from '../localization/I18nProvider'
import {getDefaultStore} from 'jotai'
import {preferencesAtom} from '../preferences'

type UnknownErrorNotifications = BasicError<'UnknownErrorNotifications'>

export function useRequestNotificationPermissions(): TE.TaskEither<
  UnknownErrorNotifications,
  'granted' | 'deniedWithoutAction' | 'deniedOpenedSettings'
> {
  const {t} = useTranslation()

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
            t('notifications.permissionsNotGranted.title'),
            t('notifications.permissionsNotGranted.message'),
            [
              {
                text: t('common.cancel'),
                onPress: () => {
                  resolve(E.right('deniedWithoutAction' as const))
                },
              },
              {
                text: t('notifications.permissionsNotGranted.openSettings'),
                style: 'cancel',
                onPress: () => {
                  NotificationSetting.open()
                  resolve(E.right('deniedOpenedSettings' as const))
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
  UnknownErrorNotifications,
  NotificationsEnabledSettings
> {
  return TE.tryCatch(async () => {
    const settings = await notifee.getNotificationSettings()

    return {
      notifications:
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
      backgroundTasks: true, // TODO how to find this out on IOS?
    }
  }, toBasicError('UnknownErrorNotifications'))
}

export async function showUINotificationFromRemoteMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  if (!remoteMessage.data && !remoteMessage.notification) return

  const {title, body} = remoteMessage.notification ?? remoteMessage.data ?? {}

  const channelId = await notifee.createChannel({
    id: 'general',
    name: 'General notifications.',
    importance: AndroidImportance.DEFAULT,
  })

  if (title && body)
    await notifee.displayNotification({
      title,
      body,
      data: remoteMessage.data,
      android: {channelId, pressAction: {id: 'default'}},
    })
}

export async function showUINotification({
  title,
  body,
}: {
  title: string
  body: string
}): Promise<void> {
  const channelId = await notifee.createChannel({
    id: 'general',
    name: 'General notifications',
    importance: AndroidImportance.DEFAULT,
  })

  await notifee.displayNotification({
    title,
    body,
    android: {channelId},
  })
}

export async function deactivateToken(): Promise<void> {
  await messaging().deleteToken()
}

export async function showDebugNotificationIfEnabled({
  title,
  body,
}: {
  title: string
  body: string
}): Promise<void> {
  if (!getDefaultStore().get(preferencesAtom).showDebugNotifications) return
  const channelId = await notifee.createChannel({
    id: 'test',
    name: 'Testing notifications',
    importance: AndroidImportance.HIGH,
  })

  await notifee.displayNotification({
    title,
    body,
    android: {channelId},
  })
}
