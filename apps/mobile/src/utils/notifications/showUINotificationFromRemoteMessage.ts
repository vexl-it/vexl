import notifee from '@notifee/react-native'
import {type FirebaseMessagingTypes} from '@react-native-firebase/messaging'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../localization/I18nProvider'
import {notificationPreferencesAtom} from '../preferences'
import reportError from '../reportError'
import {showChatNotification} from './chatNotifications'
import isChatMessageNotification from './isChatMessageNotification'
import {getDefaultChannel} from './notificationChannels'
import {
  INACTIVITY_REMINDER,
  LOGGING_ON_DIFFERENT_DEVICE,
} from './notificationTypes'

export async function showUINotificationFromRemoteMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  const {t} = getDefaultStore().get(translationAtom)
  const notificationPreferences = getDefaultStore().get(
    notificationPreferencesAtom
  )

  const type = remoteMessage?.data?.type

  if (type === LOGGING_ON_DIFFERENT_DEVICE) {
    void notifee.displayNotification({
      title: t('notifications.loggingOnDifferentDevice.title'),
      body: t('notifications.loggingOnDifferentDevice.body'),
      data: remoteMessage.data,
      android: {
        channelId: await getDefaultChannel(),
        pressAction: {
          id: 'default',
        },
      },
    })
    return
  }

  if (!remoteMessage.data && !remoteMessage.notification) return

  if (!type) {
    reportError('warn', new Error('Notification type is missing'), {
      remoteMessage,
    })
    return
  }

  if (isChatMessageNotification(remoteMessage)) {
    if (!notificationPreferences.chat) {
      console.info(
        'Received chat notification but chat notifications are disabled. Not showing notification.'
      )
      return
    }
    await showChatNotification(remoteMessage)
  } else if (type === INACTIVITY_REMINDER) {
    if (!notificationPreferences.inactivityWarnings) {
      console.info(
        'Received inactivity reminder notification but INACTIVITY_REMINDER notifications are disabled. Not showing notification.'
      )
      return
    }
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
  }
}
