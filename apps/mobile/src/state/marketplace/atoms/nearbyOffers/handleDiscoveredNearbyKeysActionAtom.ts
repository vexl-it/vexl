import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, Option, Record} from 'effect'
import {atom} from 'jotai'
import {AppState} from 'react-native'
import {apiAtom} from '../../../../api'
import {showInternalNotificationForNearbyOffers} from '../../../../utils/notifications/nearbyOffersNotification'
import {offersAtom} from '../offersState'
import {mergeIncomingOffersToState} from '../refreshOffersActionAtom/utils/mergeIncomingOffersToState'
import {
  nearbyOfferIdsToNotifyAbout,
  newlyDiscoveredNearbyKeys,
} from './discoveredNearbyKeys'
import {
  fetchNearbyOffers,
  myNearbyKeysAtom,
  receivedNearbyKeysByOfferIdAtom,
} from './nearbyOffersState'

export const handleDiscoveredNearbyKeysActionAtom = atom(
  null,
  (get, set, discoveredKeys: readonly string[]): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      const newKeys = newlyDiscoveredNearbyKeys({
        discoveredKeys,
        receivedKeysByOfferId: get(receivedNearbyKeysByOfferIdAtom),
        myKeys: get(myNearbyKeysAtom),
      })
      if (!Array.isNonEmptyReadonlyArray(newKeys)) return

      const fetchedOffers = yield* _(
        fetchNearbyOffers({offerApi: get(apiAtom).offer, keys: newKeys})
      )
      if (!Array.isNonEmptyReadonlyArray(fetchedOffers)) return

      set(offersAtom, (storedOffers) =>
        mergeIncomingOffersToState({
          incomingOffers: Array.map(fetchedOffers, (one) => one.offerInfo),
          storedOffers,
          removedOffersIds: {clubs: [], contacts: [], nearby: []},
        })
      )
      const lastSeenAt = unixMillisecondsNow()
      set(receivedNearbyKeysByOfferIdAtom, (keys) => ({
        ...keys,
        ...Record.fromIterableWith(fetchedOffers, ({key, offerInfo}) => [
          offerInfo.offerId,
          {key, lastSeenAt},
        ]),
      }))

      const offerIdsToNotifyAbout = nearbyOfferIdsToNotifyAbout({
        discoveredOfferIds: Array.map(
          fetchedOffers,
          (one) => one.offerInfo.offerId
        ),
        appState: AppState.currentState,
      })
      if (Option.isSome(offerIdsToNotifyAbout))
        yield* _(
          showInternalNotificationForNearbyOffers(offerIdsToNotifyAbout.value)
        )
    })
)
