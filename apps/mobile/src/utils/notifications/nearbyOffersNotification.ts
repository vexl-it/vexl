import {OfferId} from '@vexl-next/domain/src/general/offers'
import {type Array, Effect, Schema} from 'effect'
import {AndroidNotificationPriority} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../localization/I18nProvider'
import {displayLocalNotification} from './displayLocalNotification'
import {getDefaultChannel} from './notificationChannels'

export class NearbyOffersInternalNotificationData extends Schema.TaggedClass<NearbyOffersInternalNotificationData>(
  'NearbyOffersInternalNotificationData'
)('NearbyOffersInternalNotificationData', {
  // Set only when a single offer was discovered, otherwise the marketplace opens
  offerId: Schema.optional(OfferId),
}) {
  get encoded(): typeof NearbyOffersInternalNotificationData.Encoded {
    return Schema.encodeSync(NearbyOffersInternalNotificationData)(this)
  }
}

const NEARBY_OFFERS_NOTIFICATION_ID = 'nearby-offers-notification'

export function showInternalNotificationForNearbyOffers(
  offerIds: Array.NonEmptyReadonlyArray<OfferId>
): Effect.Effect<void> {
  return Effect.promise(async () => {
    const {t} = getDefaultStore().get(translationAtom)
    await displayLocalNotification({
      id: NEARBY_OFFERS_NOTIFICATION_ID,
      channelId: await getDefaultChannel(),
      content: {
        // TODO translate in the nearby offers UI change
        title: 'New offer nearby',
        body: t('notifications.NEW_OFFERS_IN_MARKETPLACE.body'),
        data: new NearbyOffersInternalNotificationData(
          offerIds.length === 1 ? {offerId: offerIds[0]} : {}
        ).encoded,
        priority: AndroidNotificationPriority.DEFAULT,
      },
    })
  })
}
