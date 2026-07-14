import {Effect} from 'effect'
import {AndroidNotificationPriority} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../localization/I18nProvider'
import {displayLocalNotification} from './displayLocalNotification'
import {getDefaultChannel} from './notificationChannels'
import {MARKETPLACE_READY} from './notificationTypes'

const MARKETPLACE_READY_NOTIFICATION_ID = 'marketplace-ready-notification'

export function showMarketplaceReadyNotification(): Effect.Effect<void> {
  return Effect.promise(async () => {
    const {t} = getDefaultStore().get(translationAtom)

    await displayLocalNotification({
      id: MARKETPLACE_READY_NOTIFICATION_ID,
      channelId: await getDefaultChannel(),
      content: {
        body: t('notifications.MARKETPLACE_READY.body'),
        title: t('notifications.MARKETPLACE_READY.title'),
        data: {type: MARKETPLACE_READY},
        priority: AndroidNotificationPriority.DEFAULT,
      },
    })
  })
}
