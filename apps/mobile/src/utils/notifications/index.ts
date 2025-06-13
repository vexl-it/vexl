import notifee, {AuthorizationStatus} from '@notifee/react-native'
import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {
  ExpoNotificationTokenE,
  type ExpoNotificationToken,
} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, Schema} from 'effect'
import * as Notifications from 'expo-notifications'
import * as E from 'fp-ts/Either'
import type * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {getDefaultStore} from 'jotai'
import {useEffect, useState} from 'react'
import {Alert} from 'react-native'
import NotificationSetting from 'react-native-open-notification'
import {useTranslation} from '../localization/I18nProvider'
import reportError from '../reportError'
import {areNotificationsEnabledAtom} from './areNotificaitonsEnabledAtom'

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
          getDefaultStore().set(
            areNotificationsEnabledAtom,
            result.authorizationStatus === AuthorizationStatus.AUTHORIZED
          )
          if (result.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
            resolve(E.right('granted' as const))
            return
          }

          Alert.alert(
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

export function getNotificationToken(): T.Task<ExpoNotificationToken | null> {
  return async () => {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
      })
      if (token.type !== 'expo') {
        reportError('error', new Error('Token type is not expo'), {token})
        return null
      }
      return Schema.decodeSync(ExpoNotificationTokenE)(token.data)
    } catch (e) {
      return null
    }
  }
}

export function getNotificationTokenE(): Effect.Effect<ExpoNotificationToken | null> {
  return Effect.promise(async () => {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
      })
      if (token.type !== 'expo') {
        reportError('error', new Error('Token type is not expo'), {token})
        return null
      }
      return Schema.decodeSync(ExpoNotificationTokenE)(token.data)
    } catch (e) {
      return null
    }
  })
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

export async function deactivateToken(): Promise<void> {
  await Notifications.unregisterForNotificationsAsync()
}

export function useNotificationsEnabled(): boolean {
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false)

  useEffect(() => {
    void (async () => {
      const settings = await notifee.getNotificationSettings()
      setNotificationsEnabled(
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
      )
    })()
  }, [setNotificationsEnabled])

  return notificationsEnabled
}

export async function subscribeToGeneralTopic(): Promise<void> {
  try {
    // await messaging().subscribeToTopic('general')
    console.info('Subscribed to general topic')
  } catch (e) {
    reportError(
      'error',
      new Error('Error while subscribing to general topic'),
      {e}
    )
  }
}
