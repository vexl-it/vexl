import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array, Effect, Record, pipe} from 'effect'
import {atom} from 'jotai'
import {AppState} from 'react-native'
import {apiAtom} from '../../../../api'
import {refreshLastSeenOffersActionAtom} from '../../../../utils/newOffersNotificationBackgroundTask/store'
import reportError from '../../../../utils/reportError'
import {startBenchmark} from '../../../ActionBenchmarks'
import {clubsToKeyHolderAtom} from '../../../clubs/atom/clubsToKeyHolderAtom'
import {updateOffersIdsForClubStatActionAtom} from '../../../clubs/atom/clubsWithMembersAtom'
import {sessionDataOrDummyAtom} from '../../../session'
import {ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner} from '../ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner'
import {loadingStateAtom} from '../loadingState'
import {offersAtom, offersStateAtom} from '../offersState'
import {combineIncomingOffers} from './utils/combineIncomingOffers'
import {fetchOffersReportErrorsActionAtom} from './utils/fetchOffersReportErrorsActionAtom'
import {getRemovedOffersIds} from './utils/getRemovedOffersIds'
import {mergeIncomingOffersToState} from './utils/mergeIncomingOffersToState'

export const refreshOffersActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const myStoredClubs = get(clubsToKeyHolderAtom)

    const endBenchmark = startBenchmark('Refresh offers')

    const updateStartedAt = isoNow()
    const storedOffers = get(offersAtom)

    set(loadingStateAtom, {state: 'inProgress'})

    console.log('🦋 Refreshing offers')

    const {clubs: newClubsOffers, contact: newContactOffers} = yield* _(
      set(fetchOffersReportErrorsActionAtom, {
        offersApi: api.offer,
        contactNetworkKeyPair: session.privateKey,
        clubs: myStoredClubs,
      })
    )

    set(updateOffersIdsForClubStatActionAtom, {newOffers: newClubsOffers})

    const {removedClubsOfferIdsToClubUuid, removedContactOfferIds} = yield* _(
      getRemovedOffersIds({
        offersApi: api.offer,
        storedOffers,
        storedClubs: myStoredClubs,
      })
    )

    const incomingOffers = pipe(
      [...newContactOffers, ...newClubsOffers],
      Array.groupBy((one) => one.offerId),
      Record.values,
      Array.filterMap(combineIncomingOffers)
    )

    // Update with callback to ensure no offers from state are lost
    set(offersStateAtom, (old) => ({
      ...old,
      offers: mergeIncomingOffersToState({
        incomingOffers,
        storedOffers: old.offers,
        removedOffersIds: {
          clubs: removedClubsOfferIdsToClubUuid,
          contacts: removedContactOfferIds,
        },
      }),
      lastUpdatedAt1: updateStartedAt,
    }))

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
