import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array, Effect, Record, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../../api'
import reportError from '../../../../utils/reportError'
import {clubsToKeyHolderAtom} from '../../../clubs/atom/clubsToKeyHolderAtom'
import {updateOffersIdsForClubStatActionAtom} from '../../../clubs/atom/clubsWithMembersAtom'
import {sessionDataOrDummyAtom} from '../../../session'
import {ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner} from '../ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner'
import {loadingStateAtom} from '../loadingState'
import {lastUpdatedAtAtom, offersAtom, offersStateAtom} from '../offersState'
import {combineIncomingOffers} from './utils/combineIncomingOffers'
import {fetchOffersReportErrors} from './utils/fetchOffersReportErrors'
import {getRemovedOffersIds} from './utils/getRemovedOffersIds'
import {mergeIncomingOffersToState} from './utils/mergeIncomingOffersToState'

export const refreshOffersActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const myStoredClubs = get(clubsToKeyHolderAtom)

    const updateStartedAt = isoNow()
    const storedOffers = get(offersAtom)

    set(loadingStateAtom, {state: 'inProgress'})

    console.log('🦋 Refreshing offers')

    const {clubs: newClubsOffers, contact: newContactOffers} = yield* _(
      fetchOffersReportErrors({
        offersApi: api.offer,
        lastUpdate: get(lastUpdatedAtAtom),
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
  }).pipe(
    Effect.catchAll((e) => {
      if (e._tag !== 'NetworkError')
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
