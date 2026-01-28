import notifee, {AndroidImportance} from '@notifee/react-native'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../localization/I18nProvider'
import {notificationPreferencesAtom} from '../preferences'
import checkAndShowCreateOfferPrompt from './checkAndShowCreateOfferPrompt'
import {type NotificationData} from './extractDataFromNotification'
import {getDefaultChannel} from './notificationChannels'
import {
  CREATE_OFFER_PROMPT,
  INACTIVITY_REMINDER,
  LOGGING_ON_DIFFERENT_DEVICE,
  NEW_CONTENT,
} from './notificationTypes'

export async function showUINotificationFromRemoteMessage(
  data: NotificationData
): Promise<boolean> {
  const {t} = getDefaultStore().get(translationAtom)
  const notificationPreferences = getDefaultStore().get(
    notificationPreferencesAtom
  )

  const type = (data as any).type

  if (!type) {
    return false
  }

  if (type === LOGGING_ON_DIFFERENT_DEVICE) {
    void notifee.displayNotification({
      title: t('notifications.loggingOnDifferentDevice.title'),
      body: t('notifications.loggingOnDifferentDevice.body'),
      // data,
      android: {
        smallIcon: 'notification_icon',
        channelId: await getDefaultChannel(),
        importance: AndroidImportance.HIGH,
        lightUpScreen: true,
        pressAction: {
          id: 'default',
        },
      },
    })
    return true
  }

  if (type === INACTIVITY_REMINDER) {
    if (!notificationPreferences.inactivityWarnings) {
      console.info(
        'Received inactivity reminder notification but INACTIVITY_REMINDER notifications are disabled. Not showing notification.'
      )
      return true
    }

    await notifee.displayNotification({
      title: t(`notifications.INACTIVITY_REMINDER.title`),
      body: t(`notifications.INACTIVITY_REMINDER.body`),
      // data,
      android: {
        smallIcon: 'notification_icon',
        channelId: await getDefaultChannel(),
        pressAction: {
          id: 'default',
        },
      },
    })

    return true
  }

  if (type === CREATE_OFFER_PROMPT) {
    void checkAndShowCreateOfferPrompt(getDefaultStore())
    return true
  }

  if (type === NEW_CONTENT) {
    // TODO notification here should be displayed see: #1263
    return true
  }

  return false
}
