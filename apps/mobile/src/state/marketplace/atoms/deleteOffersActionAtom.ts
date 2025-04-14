import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import reportError from '../../../utils/reportError'
import offerToConnectionsAtom from '../../connections/atom/offerToConnectionsAtom'
import {offersAtom} from './offersState'

export const deleteOffersActionAtom = atom<
  null,
  [{adminIds: OfferAdminId[]}],
  Effect.Effect<void, Effect.Effect.Error<ReturnType<OfferApi['deleteOffer']>>>
>(null, (get, set, params) => {
  const {adminIds: adminIdsToDelete} = params
  const api = get(apiAtom)
  const offers = get(offersAtom)

  return Effect.gen(function* (_) {
    yield* _(api.offer.deleteOffer({query: {adminIds: adminIdsToDelete}}))

    // Delete offer to connections
    set(offerToConnectionsAtom, (prev) => ({
      offerToConnections: prev.offerToConnections.filter(
        (one) => !adminIdsToDelete.includes(one.adminId)
      ),
    }))

    // Delete offers
    set(
      offersAtom,
      offers.filter(
        (o) =>
          !o.ownershipInfo?.adminId ||
          !adminIdsToDelete.includes(o.ownershipInfo?.adminId)
      )
    )
  }).pipe(
    Effect.mapError((e) => {
      reportError('error', new Error('Error while deleting offers'), {e})
      return e
    })
  )
})
