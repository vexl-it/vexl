import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, Record, pipe} from 'effect'
import {atom} from 'jotai'
import {AppState} from 'react-native'
import {apiAtom} from '../../../../api'
import {refreshLastSeenOffersActionAtom} from '../../../../utils/newOffersNotificationBackgroundTask/store'
import reportError from '../../../../utils/reportError'
import {startBenchmark} from '../../../ActionBenchmarks'
import {clubsToKeyHolderAtom} from '../../../clubs/atom/clubsToKeyHolderV2Atom'
import {updateOffersIdsForClubStateActionAtom} from '../../../clubs/atom/clubsWithMembersAtom'
import {sessionDataOrDummyAtom} from '../../../session'
import {ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner} from '../ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner'
import {loadingStateAtom} from '../loadingState'
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
} = {removedContactOfferIds: [], removedClubsOfferIdsToClubUuid: []}

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

      const {removedClubsOfferIdsToClubUuid, removedContactOfferIds} = yield* _(
        shouldReconcileRemovedOffers
          ? getRemovedOffersIds({
              offersApi: api.offer,
              storedOffers,
              storedClubs: myStoredClubs,
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
        [...newContactOffers, ...newClubsOffers],
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
        },
      })

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
      }

      endBenchmark(
        `Incoming offers: ${incomingOffers.length}. Removed offers: ${removedClubsOfferIdsToClubUuid.length + removedContactOfferIds.length}`
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
