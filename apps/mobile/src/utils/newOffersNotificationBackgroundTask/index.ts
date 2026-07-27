import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {getDefaultStore} from 'jotai'
import {AppState} from 'react-native'
import {filteredOffersIncludingLocationFilterAtom} from '../../state/marketplace/atoms/filteredOffers'
import {refreshOffersActionAtom} from '../../state/marketplace/atoms/refreshOffersActionAtom'
import {
  markMarketplaceReadyNotificationFlowAsCompletedActionAtom,
  marketplaceReadyNotificationStore,
} from '../marketplaceReadyNotification/store'
import {showMarketplaceReadyNotification} from '../notifications/marketplaceReadyNotification'
import {showInternalNotificationForNewOffers} from '../notifications/newOffersNotification'
import {preferencesAtom} from '../preferences'
import {
  newOfferNotificationsPreferencesStore,
  recordNewOffersNotificationSentActionAtom,
} from './store'

const NOTIFICATION_TIME_LIMIT = 1000 * 60 * 60 * 24

export const newOffersNotificationBackgroundTask = async (): Promise<void> => {
  console.log('New offers background task executed')

  if (AppState.currentState === 'active') return
  const store = getDefaultStore()
  const {
    notificationPreferences: {newOfferInMarketplace},
  } = store.get(preferencesAtom)

  const newOffersPreferences = store.get(newOfferNotificationsPreferencesStore)
  const marketplaceReadyPreferences = store.get(
    marketplaceReadyNotificationStore
  )
  const now = unixMillisecondsNow()
  const marketplaceReadyFlowIsActive =
    marketplaceReadyPreferences.notificationState === 'waitingForFirstOffer'
  const regularNewOffersNotificationIsThrottled =
    newOffersPreferences.lastSentNotificationAt + NOTIFICATION_TIME_LIMIT > now

  if (!newOfferInMarketplace) {
    console.log('Ignoring marketplace notification due to disabled preference')
    return
  }

  if (
    !marketplaceReadyFlowIsActive &&
    regularNewOffersNotificationIsThrottled
  ) {
    console.log('Ignoring new offers notification due to time limit')
    return
  }

  await Effect.runPromise(store.set(refreshOffersActionAtom))
  const currentOfferIds = pipe(
    store.get(filteredOffersIncludingLocationFilterAtom),
    Array.map((offer) => offer.offerInfo.offerId)
  )
  if (marketplaceReadyFlowIsActive) {
    if (!Array.isNonEmptyArray(currentOfferIds)) {
      console.log('Marketplace is still empty')
      return
    }

    await Effect.runPromise(showMarketplaceReadyNotification())
    const notificationSentAt = unixMillisecondsNow()

    store.set(markMarketplaceReadyNotificationFlowAsCompletedActionAtom)
    store.set(recordNewOffersNotificationSentActionAtom, {
      lastSeenOffers: currentOfferIds,
      notificationSentAt,
    })
    return
  }

  const newOfferIds = Array.difference(
    currentOfferIds,
    newOffersPreferences.lastSeenOffers
  )
  if (!Array.isNonEmptyArray(newOfferIds)) {
    console.log('No new offers to notify about')
    return
  }

  await Effect.runPromise(showInternalNotificationForNewOffers())
  const notificationSentAt = unixMillisecondsNow()

  store.set(recordNewOffersNotificationSentActionAtom, {
    lastSeenOffers: currentOfferIds,
    notificationSentAt,
  })
}
