import notifee, {AndroidImportance} from '@notifee/react-native'
import {getOrElse} from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {storage} from '../mmkv/fpMmkv'

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

async function groupNotificationDisplayed(groupId: string): Promise<boolean> {
  const notifications = await notifee.getDisplayedNotifications()
  const groupNotification = notifications.find(
    (one) =>
      one.notification.android?.groupSummary &&
      one.notification.android?.groupId
  )
  return !!groupNotification
}

export async function showDebugNotificationIfEnabled({
  title,
  subtitle,
  body,
}: {
  title: string
  subtitle?: string
  body: string
}): Promise<void> {
  if (!getShowDebugNotifications()) return

  const channelId = await notifee.createChannel({
    id: 'test',
    name: 'Testing notifications',
    importance: AndroidImportance.HIGH,
  })

  if (subtitle && !(await groupNotificationDisplayed(subtitle))) {
    await notifee.displayNotification({
      title: subtitle,
      body: `${subtitle} logs`,
      android: {
        groupId: subtitle,
        channelId,
        groupSummary: true,
      },
    })
  }

  await notifee.displayNotification({
    title,
    body,
    subtitle,
    android: {
      groupId: subtitle,
      channelId,
      pressAction: {
        id: 'default',
      },
    },
  })
}
