import {OfferId} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Schema, pipe} from 'effect'
import {atom} from 'jotai'
import {filteredOffersIncludingLocationFilterAtom} from '../../state/marketplace/atoms/filteredOffers'
import {atomWithParsedMmkvStorageWithImmediateSaveOption} from '../atomUtils/atomWithParsedMmkvStorage'

const {
  atom: newOfferNotificationsPreferencesStore,
  setAndSaveImmediatelyAtom: setNewOfferNotificationsPreferencesImmediatelyAtom,
} = atomWithParsedMmkvStorageWithImmediateSaveOption(
  'newOfferNotificationPreferences',
  {
    lastSentNotificationAt: UnixMilliseconds0,
    lastSeenOffers: [],
  },
  Schema.Struct({
    lastSentNotificationAt: UnixMilliseconds,
    lastSeenOffers: Schema.Array(OfferId),
  })
)

export {newOfferNotificationsPreferencesStore}

export const refreshLastSeenOffersActionAtom = atom(null, (get, set) => {
  const currentOfferIds = pipe(
    get(filteredOffersIncludingLocationFilterAtom),
    Array.map((offer) => offer.offerInfo.offerId)
  )
  // Skip the write (a full persisted-store rewrite + derived-atom
  // invalidation) when the ids did not change — the common case on no-op
  // refreshes.
  const {lastSeenOffers} = get(newOfferNotificationsPreferencesStore)
  if (
    lastSeenOffers.length === currentOfferIds.length &&
    Array.every(lastSeenOffers, (id, i) => id === currentOfferIds[i])
  )
    return

  set(newOfferNotificationsPreferencesStore, (prev) => ({
    ...prev,
    lastSeenOffers: currentOfferIds,
  }))
})

export const recordNewOffersNotificationSentActionAtom = atom(
  null,
  (
    _,
    set,
    {
      lastSeenOffers,
      notificationSentAt,
    }: {
      readonly lastSeenOffers: readonly OfferId[]
      readonly notificationSentAt: UnixMilliseconds
    }
  ) => {
    set(setNewOfferNotificationsPreferencesImmediatelyAtom, {
      lastSentNotificationAt: notificationSentAt,
      lastSeenOffers,
    })
  }
)
