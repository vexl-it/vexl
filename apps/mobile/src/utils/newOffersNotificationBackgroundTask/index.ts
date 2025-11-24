import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, pipe} from 'effect'
import {getDefaultStore} from 'jotai'
import {AppState} from 'react-native'
import {filteredOffersIncludingLocationFilterAtom} from '../../state/marketplace/atoms/filteredOffers'
import {refreshOffersActionAtom} from '../../state/marketplace/atoms/refreshOffersActionAtom'
import {showInternalNotificationForNewOffers} from '../notifications/newOffersNotification'
import {preferencesAtom} from '../preferences'
import {newOfferNotificationsPreferencesStore} from './store'

const NOTIFICATION_TIME_LIMIT = 1000 * 60 * 60 * 24 // 24 hours

export const newOffersNotificationBackgroundTask = async (): Promise<void> => {
  console.log('New offers background task executed')

  if (AppState.currentState === 'active') return
  const {
    notificationPreferences: {newOfferInMarketplace},
  } = getDefaultStore().get(preferencesAtom)

  const store = getDefaultStore()
  const newOfferNotificationsPreferences = store.get(
    newOfferNotificationsPreferencesStore
  )
  if (
    newOfferNotificationsPreferences.lastSentNotificationAt +
      NOTIFICATION_TIME_LIMIT >
      unixMillisecondsNow() ||
    !newOfferInMarketplace
  ) {
    console.log(
      'Ignoring new offers notification due to time limit or disabled preference'
    )
    return
  }

  await Effect.runPromise(store.set(refreshOffersActionAtom))
  const currentOfferIds = pipe(
    store.get(filteredOffersIncludingLocationFilterAtom),
    Array.map((offer) => offer.offerInfo.offerId)
  )

  const newOfferIds = Array.difference(
    currentOfferIds,
    newOfferNotificationsPreferences.lastSeenOffers
  )
  if (!Array.isNonEmptyArray(newOfferIds)) {
    console.log('No new offers to notify about')
    return
  }

  await Effect.runPromise(showInternalNotificationForNewOffers())

  store.set(newOfferNotificationsPreferencesStore, (prev) => ({
    ...prev,
    lastSentNotificationAt: unixMillisecondsNow(),
    lastSeenOffers: currentOfferIds,
  }))
}
