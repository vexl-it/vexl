import {
  AndroidImportance,
  setNotificationChannelAsync,
} from 'expo-notifications'
import {getOrElse} from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {storage} from '../mmkv/effectMmkv'
import {displayLocalNotification} from './displayLocalNotification'

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

async function getDebugChannel(): Promise<string> {
  await setNotificationChannelAsync('test', {
    name: 'Testing notifications',
    importance: AndroidImportance.HIGH,
  })
  return 'test'
}

export async function showDebugNotificationIfEnabled({
  title,
  subtitle,
  body,
  force = false,
}: {
  title: string
  subtitle?: string
  body: string
  force?: boolean
}): Promise<void> {
  if (!force && !getShowDebugNotifications()) return

  const channelId = await getDebugChannel()

  await displayLocalNotification({
    channelId,
    content: {
      title,
      body,
      subtitle,
    },
  })
}
