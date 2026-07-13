import {OfferId} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Schema, pipe} from 'effect'
import {atom} from 'jotai'
import {filteredOffersIncludingLocationFilterAtom} from '../../state/marketplace/atoms/filteredOffers'
import {atomWithParsedMmkvStorage} from '../atomUtils/atomWithParsedMmkvStorage'

export const newOfferNotificationsPreferencesStore = atomWithParsedMmkvStorage(
  'newOfferNotificationPreferences',
  {
    lastSentNotificationAt: UnixMilliseconds0,
    lastSeenOffers: [],
  },
  Schema.Struct({
    lastSentNotificationAt: UnixMilliseconds,
    lastSeenOffers: Schema.Array(OfferId),
  }),
  'ephemeral'
)

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
