import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type OfferId,
  type OfferInfo,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, Record, pipe} from 'effect'
import {atom} from 'jotai'
import {AppState} from 'react-native'
import {apiAtom} from '../../../../api'
import {markMarketplaceReadyNotificationFlowAsCompletedIfOffersAreVisibleActionAtom} from '../../../../utils/marketplaceReadyNotification/store'
import {refreshLastSeenOffersActionAtom} from '../../../../utils/newOffersNotificationBackgroundTask/store'
import {nearbyOffersEnabledAtom} from '../../../../utils/preferences'
import reportError from '../../../../utils/reportError'
import {startBenchmark} from '../../../ActionBenchmarks'
import {clubsToKeyHolderAtom} from '../../../clubs/atom/clubsToKeyHolderV2Atom'
import {updateOffersIdsForClubStateActionAtom} from '../../../clubs/atom/clubsWithMembersAtom'
import {sessionDataOrDummyAtom} from '../../../session'
import {ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner} from '../ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner'
import {loadingStateAtom} from '../loadingState'
import {
  fetchNearbyOffers,
  receivedNearbyKeysByOfferIdAtom,
} from '../nearbyOffers/nearbyOffersState'
import {anyMarketplaceSuggestionDismissedInThisSessionAtom} from '../offerSuggestionVisible'
import {offersAtom, offersStateAtom} from '../offersState'
import {reportOffersWithoutLocationActionAtom} from '../offersToSeeInMarketplace'
import {combineIncomingOffers} from './utils/combineIncomingOffers'
import {fetchOffersReportErrorsActionAtom} from './utils/fetchOffersReportErrorsActionAtom'
import {getRemovedOffersIds} from './utils/getRemovedOffersIds'
import {mergeIncomingOffersToState} from './utils/mergeIncomingOffersToState'

// Reconciling removed offers POSTs every stored offer id to the server, so it
// is throttled instead of running on every refresh (refreshes can be as
// frequent as every few seconds on an empty marketplace).
const REMOVED_OFFERS_RECONCILIATION_INTERVAL_MS = 10 * 60 * 1000
const lastRemovedOffersReconciliationAtAtom = atom(0)

const NO_REMOVED_OFFERS: {
  removedContactOfferIds: readonly OfferId[]
  removedClubsOfferIdsToClubUuid: ReadonlyArray<{
    clubUuid: ClubUuid
    removedIds: readonly OfferId[]
  }>
  removedNearbyOfferIds: readonly OfferId[]
} = {
  removedContactOfferIds: [],
  removedClubsOfferIdsToClubUuid: [],
  removedNearbyOfferIds: [],
}

// Unchanged re-fetched nearby offers would only rewrite the persisted state
const changedNearbyOffers = ({
  storedOffers,
  nearbyOffers,
}: {
  storedOffers: readonly OneOfferInState[]
  nearbyOffers: readonly OfferInfo[]
}): readonly OfferInfo[] => {
  const storedOffersById = new Map(
    Array.map(storedOffers, (one): [OfferId, OfferInfo] => [
      one.offerInfo.offerId,
      one.offerInfo,
    ])
  )
  return Array.filter(nearbyOffers, (nearbyOffer) => {
    const storedOffer = storedOffersById.get(nearbyOffer.offerId)
    return (
      storedOffer === undefined ||
      storedOffer.modifiedAt !== nearbyOffer.modifiedAt ||
      !Array.contains(storedOffer.privatePart.friendLevel, 'NEARBY')
    )
  })
}

export const refreshOffersActionAtom = atom(
  null,
  (get, set, options?: {readonly forceRemovedOffersReconciliation?: boolean}) =>
    Effect.gen(function* (_) {
      const api = get(apiAtom)
      const session = get(sessionDataOrDummyAtom)
      const myStoredClubs = get(clubsToKeyHolderAtom)

      const endBenchmark = startBenchmark('Refresh offers')

      const storedOffers = get(offersAtom)

      set(loadingStateAtom, {state: 'inProgress'})

      console.log('🦋 Refreshing offers')

      const {clubs: newClubsOffers, contact: newContactOffers} = yield* _(
        set(fetchOffersReportErrorsActionAtom, {
          offersApi: api.offer,
          contactNetworkKeyPair: session.privateKey,
          contactNetworkKeyPairV2: session.keyPairV2,
          clubs: myStoredClubs,
        })
      )

      // With no new club offers the update is a no-op that would only rewrite
      // the persisted clubs state, so skip it entirely.
      if (Array.isNonEmptyReadonlyArray(newClubsOffers))
        set(updateOffersIdsForClubStateActionAtom, {newOffers: newClubsOffers})

      // A user-initiated refresh (pull-to-refresh) bypasses the throttle so
      // offers deleted/unshared on the server disappear immediately instead of
      // lingering until the interval expires.
      const shouldReconcileRemovedOffers =
        options?.forceRemovedOffersReconciliation === true ||
        Date.now() - get(lastRemovedOffersReconciliationAtAtom) >=
          REMOVED_OFFERS_RECONCILIATION_INTERVAL_MS

      const nearbyKeysByOfferId = get(nearbyOffersEnabledAtom)
        ? Record.map(get(receivedNearbyKeysByOfferIdAtom), ({key}) => key)
        : {}

      // Nearby offers have no incremental endpoint (one request per key), so
      // they are re-fetched together with the throttled reconciliation.
      const newNearbyOffers = yield* _(
        shouldReconcileRemovedOffers
          ? fetchNearbyOffers({
              offerApi: api.offer,
              keys: Record.values(nearbyKeysByOfferId),
            })
          : Effect.succeed([])
      )

      const {
        removedClubsOfferIdsToClubUuid,
        removedContactOfferIds,
        removedNearbyOfferIds,
      } = yield* _(
        shouldReconcileRemovedOffers
          ? getRemovedOffersIds({
              offersApi: api.offer,
              storedOffers,
              storedClubs: myStoredClubs,
              nearbyKeysByOfferId,
            }).pipe(
              Effect.tap((result) =>
                Effect.sync(() => {
                  // Only throttle when the reconciliation actually succeeded, so a
                  // transient failure retries on the next refresh instead of
                  // leaving removed offers visible for the full interval.
                  if (result.succeeded)
                    set(lastRemovedOffersReconciliationAtAtom, Date.now())
                })
              )
            )
          : Effect.succeed(NO_REMOVED_OFFERS)
      )

      const incomingOffers = pipe(
        [
          ...newContactOffers,
          ...newClubsOffers,
          ...changedNearbyOffers({
            storedOffers,
            nearbyOffers: Array.map(newNearbyOffers, (one) => one.offerInfo),
          }),
        ],
        Array.groupBy((one) => one.offerId),
        Record.values,
        Array.filterMap(combineIncomingOffers)
      )

      // Read fresh state right before merging to ensure no offers
      // written while fetching are lost.
      const offersBeforeMerge = get(offersAtom)
      const mergedOffers = mergeIncomingOffersToState({
        incomingOffers,
        storedOffers: offersBeforeMerge,
        removedOffersIds: {
          clubs: removedClubsOfferIdsToClubUuid,
          contacts: removedContactOfferIds,
          nearby: removedNearbyOfferIds,
        },
      })

      if (Array.isNonEmptyReadonlyArray(removedNearbyOfferIds))
        set(receivedNearbyKeysByOfferIdAtom, (keys) =>
          Record.filter(
            keys,
            (_, offerId) => !Array.contains(removedNearbyOfferIds, offerId)
          )
        )

      // Skip the state write (and the full persisted-blob rewrite + derived-atom
      // invalidation it causes) when the refresh changed nothing.
      if (mergedOffers !== offersBeforeMerge) {
        set(offersStateAtom, (old) => ({...old, offers: mergedOffers}))
        set(reportOffersWithoutLocationActionAtom)
      }
      set(anyMarketplaceSuggestionDismissedInThisSessionAtom, false)

      yield* _(
        set(ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner)
      )

      if (AppState.currentState === 'active') {
        set(refreshLastSeenOffersActionAtom)
        set(
          markMarketplaceReadyNotificationFlowAsCompletedIfOffersAreVisibleActionAtom
        )
      }

      endBenchmark(
        `Incoming offers: ${incomingOffers.length}. Removed offers: ${removedClubsOfferIdsToClubUuid.length + removedContactOfferIds.length + removedNearbyOfferIds.length}`
      )
    }).pipe(
      Effect.catchAll((e) => {
        reportError('error', new Error('Error fetching offers'), {e})
        set(loadingStateAtom, {state: 'error', error: e})

        return Effect.void
      }),
      Effect.zipLeft(
        Effect.sync(() => {
          set(loadingStateAtom, {state: 'success'})
        })
      )
    )
)
