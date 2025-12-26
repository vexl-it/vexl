import {OfferId} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
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
  })
)

export const refreshLastSeenOffersActionAtom = atom(null, (get, set) => {
  const currentOfferIds = pipe(
    get(filteredOffersIncludingLocationFilterAtom),
    Array.map((offer) => offer.offerInfo.offerId)
  )
  set(newOfferNotificationsPreferencesStore, (prev) => ({
    ...prev,
    lastSeenOffers: currentOfferIds,
  }))
})
