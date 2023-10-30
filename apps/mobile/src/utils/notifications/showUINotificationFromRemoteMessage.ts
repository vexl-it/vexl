import {type FirebaseMessagingTypes} from '@react-native-firebase/messaging'
import {
  CHAT_NOTIFICATION_TYPE,
  CHAT_NOTIFICATION_TYPES,
  INACTIVITY_REMINDER,
} from './notificationTypes'
import notifee, {AndroidImportance} from '@notifee/react-native'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../localization/I18nProvider'
import {notificationPreferencesAtom} from '../preferences'
import reportError from '../reportError'
import {NotificationId} from './NotificationId.brand'
import {addNotificationToDisplayedNotificationsActionAtom} from '../../state/displayedNotifications'
import {ChatNotificationData} from './ChatNotificationData'
import decodeNotificationPreviewAction from '../../state/chat/atoms/decodeChatNotificationPreviewActionAtom'

async function getChannelForMessages(): Promise<string> {
  return await notifee.createChannel({
    id: 'Chat',
    name: 'Chat notifications.',
    importance: AndroidImportance.HIGH,
  })
}

export async function getDefaultChannel(): Promise<string> {
  return await notifee.createChannel({
    id: 'Chat',
    name: 'Chat notifications.',
    importance: AndroidImportance.HIGH,
  })
}

function isChatNotificationType(
  type: string
): type is (typeof CHAT_NOTIFICATION_TYPES)[0] {
  return (CHAT_NOTIFICATION_TYPES as string[]).includes(type)
}

export async function showUINotificationFromRemoteMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  const {t} = getDefaultStore().get(translationAtom)
  const notificationPreferences = getDefaultStore().get(
    notificationPreferencesAtom
  )

  const type = remoteMessage?.data?.type

  if (!remoteMessage.data && !remoteMessage.notification) return

  if (!type) {
    reportError('warn', 'Notification type is missing', remoteMessage)
    return
  }

  if (isChatNotificationType(type)) {
    if (!notificationPreferences.chat) {
      console.info(
        'Received chat notification but chat notifications are disabled. Not showing notification.'
      )
      return
    }

    if (type === CHAT_NOTIFICATION_TYPE.CANCEL_REQUEST_MESSAGING) return // No message displayed in this case

    const notificationData = ChatNotificationData.safeParse(remoteMessage.data)
    if (!notificationData.success) {
      reportError(
        'warn',
        'Unable to parse notification data for chat notification',
        remoteMessage
      )
      return
    }

    const decodedPreview = await getDefaultStore().set(
      decodeNotificationPreviewAction,
      notificationData.data
    )()

    const notificationId = await (async () => {
      if (decodedPreview) {
        return NotificationId.parse(
          await notifee.displayNotification({
            title: decodedPreview.name,
            body: decodedPreview.text,
            data: remoteMessage.data,
            android: {
              channelId: await getChannelForMessages(),
              pressAction: {
                id: 'default',
              },
            },
          })
        )
      } else {
        return NotificationId.parse(
          await notifee.displayNotification({
            title: t(`notifications.${type}.title`),
            body: t(`notifications.${type}.body`),
            data: remoteMessage.data,
            android: {
              channelId: await getChannelForMessages(),
              pressAction: {
                id: 'default',
              },
            },
          })
        )
      }
    })()

    getDefaultStore().set(addNotificationToDisplayedNotificationsActionAtom, {
      type: 'chat',
      notificationId,
      notificationData: notificationData.data,
    })
  } else if (type === INACTIVITY_REMINDER) {
    if (!notificationPreferences.inactivityWarnings) {
      console.info(
        'Received inactivity reminder notification but INACTIVITY_REMINDER notifications are disabled. Not showing notification.'
      )
      return
    }
    NotificationId.parse(
      await notifee.displayNotification({
        title: t(`notifications.INACTIVITY_REMINDER.title`),
        body: t(`notifications.INACTIVITY_REMINDER.body`),
        data: remoteMessage.data,
        android: {
          channelId: await getDefaultChannel(),
          pressAction: {
            id: 'default',
          },
        },
      })
    )
  }
}
