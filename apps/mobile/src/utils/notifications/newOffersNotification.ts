import {Effect, Schema} from 'effect'
import {
  AndroidNotificationPriority,
  dismissNotificationAsync,
} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../localization/I18nProvider'
import {displayLocalNotification} from './displayLocalNotification'
import {getDefaultChannel} from './notificationChannels'

export class NewOffersInternalNotificationData extends Schema.TaggedClass<NewOffersInternalNotificationData>(
  'NewOffersInternalNotificationData'
)('NewOffersInternalNotificationData', {}) {
  get encoded(): typeof NewOffersInternalNotificationData.Encoded {
    return Schema.encodeSync(NewOffersInternalNotificationData)(this)
  }
}

const NEW_OFFERS_IN_MARKETPLACE_NOTIFICATION_ID = 'new-offers-notification'

export function showInternalNotificationForNewOffers(): Effect.Effect<void> {
  return Effect.promise(async () => {
    const {t} = getDefaultStore().get(translationAtom)
    await displayLocalNotification({
      id: NEW_OFFERS_IN_MARKETPLACE_NOTIFICATION_ID,
      channelId: await getDefaultChannel(),
      content: {
        body: t('notifications.NEW_OFFERS_IN_MARKETPLACE.body'),
        title: t('notifications.NEW_OFFERS_IN_MARKETPLACE.title'),
        data: new NewOffersInternalNotificationData().encoded,
        priority: AndroidNotificationPriority.DEFAULT,
      },
    })
  })
}

export function cancelNewOffersNotification(): Effect.Effect<void> {
  return Effect.promise(async () => {
    await dismissNotificationAsync(NEW_OFFERS_IN_MARKETPLACE_NOTIFICATION_ID)
  })
}
