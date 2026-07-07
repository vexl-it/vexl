import {Array, Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {reportErrorE} from '../../../utils/reportError'
import {myOffersAtom, updateMyOfferPrivatePayloadActionAtom} from './myOffers'

export const ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner =
  atom(null, (get, set) => {
    const offersToUpdate = pipe(
      get(myOffersAtom),
      Array.filter(
        (one) =>
          !one.offerInfo.privatePart.adminId ||
          !one.offerInfo.privatePart.intendedConnectionLevel
      )
    )

    if (!Array.isNonEmptyArray(offersToUpdate)) return Effect.void

    console.log(
      `Updating offers to include owner info in owner's private payload. Count: ${offersToUpdate.length}`
    )

    // updateMyOfferPrivatePayloadActionAtom re-encrypts + uploads the owner
    // private payload AND persists the uploaded payload into local offer state,
    // so this step converges instead of repeating on every refresh.
    return Effect.forEach(
      offersToUpdate,
      (one) =>
        set(updateMyOfferPrivatePayloadActionAtom, {
          adminId: one.ownershipInfo.adminId,
          intendedConnectionLevel: one.ownershipInfo.intendedConnectionLevel,
          intendedClubs: [...(one.ownershipInfo.intendedClubs ?? [])],
        }).pipe(
          Effect.tapError((e) =>
            reportErrorE(
              'warn',
              new Error('Error updating owner private payload'),
              {e}
            )
          ),
          Effect.ignore
        ),
      {discard: true}
    )
  })
