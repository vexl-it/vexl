import {OfferIdE} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds0,
  UnixMillisecondsE,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {filteredOffersIncludingLocationFilterAtom} from '../../state/marketplace/atoms/filteredOffers'
import {atomWithParsedMmkvStorageE} from '../atomUtils/atomWithParsedMmkvStorageE'

export const newOfferNotificationsPreferencesStore = atomWithParsedMmkvStorageE(
  'newOfferNotificationPreferences',
  {
    lastSentNotificationAt: UnixMilliseconds0,
    lastSeenOffers: [],
  },
  Schema.Struct({
    lastSentNotificationAt: UnixMillisecondsE,
    lastSeenOffers: Schema.Array(OfferIdE),
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
