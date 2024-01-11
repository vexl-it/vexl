import notifee, {AndroidImportance} from '@notifee/react-native'
import {storage} from '../fpMmkv'
import {getOrElse} from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'

const DEBUG_NOTIFICATIONS_ENABLED_KEY = 'debugNotificationsEnabled'

export function setShowDebugNotifications(value: boolean): void {
  storage.set(DEBUG_NOTIFICATIONS_ENABLED_KEY)(value ? 'true' : 'false')
}

export function getShowDebugNotifications(): boolean {
  return (
    pipe(
      storage.get(DEBUG_NOTIFICATIONS_ENABLED_KEY),
      getOrElse(() => 'false')
    ) === 'true'
  )
}

export async function showDebugNotificationIfEnabled({
  title,
  body,
}: {
  title: string
  body: string
}): Promise<void> {
  if (!getShowDebugNotifications()) return

  const channelId = await notifee.createChannel({
    id: 'test',
    name: 'Testing notifications',
    importance: AndroidImportance.HIGH,
  })

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
    },
  })
}
