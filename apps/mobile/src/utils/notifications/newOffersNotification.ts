import notifee, {AndroidImportance} from '@notifee/react-native'
import {Effect, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../localization/I18nProvider'
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
    await notifee.displayNotification({
      id: NEW_OFFERS_IN_MARKETPLACE_NOTIFICATION_ID,
      body: t('notifications.NEW_OFFERS_IN_MARKETPLACE.body'),
      title: t('notifications.NEW_OFFERS_IN_MARKETPLACE.title'),
      data: new NewOffersInternalNotificationData().encoded,
      android: {
        smallIcon: 'notification_icon',

        lightUpScreen: true,
        importance: AndroidImportance.DEFAULT,
        pressAction: {
          id: 'default',
        },
        channelId: await getDefaultChannel(),
      },
    })
  })
}

export function cancelNewOffersNotification(): Effect.Effect<void> {
  return Effect.promise(async () => {
    await notifee.cancelNotification(NEW_OFFERS_IN_MARKETPLACE_NOTIFICATION_ID)
  })
}
