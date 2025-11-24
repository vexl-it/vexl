import notifee, {AuthorizationStatus} from '@notifee/react-native'
import {
  ExpoNotificationTokenE,
  type ExpoNotificationToken,
} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, Either, Schema} from 'effect'
import {BackgroundTaskStatus, getStatusAsync} from 'expo-background-task'
import * as Notifications from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {useEffect, useState} from 'react'
import {Alert} from 'react-native'
import NotificationSetting from 'react-native-open-notification'
import {useTranslation} from '../localization/I18nProvider'
import reportError from '../reportError'
import {areNotificationsEnabledAtom} from './areNotificaitonsEnabledAtom'

export class UnknownErrorNotifications extends Schema.TaggedError<UnknownErrorNotifications>(
  'UnknownErrorNotifications'
)('UnknownErrorNotifications', {
  cause: Schema.Unknown,
}) {}

export function useRequestNotificationPermissions(): Effect.Effect<
  'granted' | 'deniedWithoutAction' | 'deniedOpenedSettings',
  UnknownErrorNotifications
> {
  const {t} = useTranslation()

  return Effect.promise(async () => {
    return await new Promise<
      Either.Either<
        'granted' | 'deniedWithoutAction' | 'deniedOpenedSettings',
        UnknownErrorNotifications
      >
    >((resolve) => {
      notifee
        .requestPermission()
        .then((result) => {
          getDefaultStore().set(
            areNotificationsEnabledAtom,
            result.authorizationStatus === AuthorizationStatus.AUTHORIZED
          )
          if (result.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
            resolve(Either.right('granted' as const))
            return
          }

          Alert.alert(
            t('notifications.permissionsNotGranted.title'),
            t('notifications.permissionsNotGranted.message'),
            [
              {
                text: t('common.cancel'),
                onPress: () => {
                  resolve(Either.right('deniedWithoutAction' as const))
                },
              },
              {
                text: t('notifications.permissionsNotGranted.openSettings'),
                style: 'cancel',
                onPress: () => {
                  NotificationSetting.open()
                  resolve(Either.right('deniedOpenedSettings' as const))
                },
              },
            ]
          )
        })
        .catch((e) => {
          resolve(
            Either.left(
              new UnknownErrorNotifications({
                cause: new Error('Error requesting permissions', {cause: e}),
              })
            )
          )
        })
    })
  }).pipe(
    Effect.flatMap((either) =>
      Either.match(either, {
        onLeft: (error) => Effect.fail(error),
        onRight: (value) => Effect.succeed(value),
      })
    )
  )
}

export function getNotificationTokenE(): Effect.Effect<ExpoNotificationToken | null> {
  const getExpoNotificationToken = Effect.promise(async () => {
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

  return Effect.gen(function* (_) {
    const notificationEnabled = yield* _(
      areNotificationsEnabledE(),
      Effect.map((s) => s.notifications),
      Effect.catchAll((e) => Effect.succeed(false))
    )

    if (!notificationEnabled) {
      return null
    }

    return yield* _(getExpoNotificationToken)
  })
}

// Old fp-ts version for backwards compatibility - deprecated, use getNotificationTokenE
export function getNotificationToken(): Promise<ExpoNotificationToken | null> {
  return Effect.runPromise(getNotificationTokenE())
}

export interface NotificationsEnabledSettings {
  readonly notifications: boolean
  readonly backgroundTasks: boolean
}

export function areNotificationsEnabled(): Effect.Effect<
  NotificationsEnabledSettings,
  UnknownErrorNotifications
> {
  return Effect.tryPromise({
    try: async () => {
      const settings = await notifee.getNotificationSettings()
      const backgroundFetchStatus = await getStatusAsync()

      return {
        notifications:
          settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
        backgroundTasks:
          backgroundFetchStatus === BackgroundTaskStatus.Available,
      }
    },
    catch: (e) =>
      new UnknownErrorNotifications({
        cause: e,
      }),
  })
}

export function areNotificationsEnabledE(): Effect.Effect<
  NotificationsEnabledSettings,
  UnknownErrorNotifications
> {
  return Effect.tryPromise({
    try: async () => {
      const settings = await notifee.getNotificationSettings()
      const backgroundFetchStatus = await getStatusAsync()

      return {
        notifications:
          settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
        backgroundTasks:
          backgroundFetchStatus === BackgroundTaskStatus.Available,
      }
    },
    catch: (e) => new UnknownErrorNotifications({cause: e}),
  })
}

export function isBackgroundFetchEnabled(): Effect.Effect<boolean> {
  return Effect.promise(async () => {
    const status = await getStatusAsync()
    return status === BackgroundTaskStatus.Available
  })
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
