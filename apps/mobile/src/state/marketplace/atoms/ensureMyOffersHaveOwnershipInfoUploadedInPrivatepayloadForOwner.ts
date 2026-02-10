import updateOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/updateOwnerPrivatePayload'
import {Array, Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {reportErrorE} from '../../../utils/reportError'
import {sessionDataOrDummyAtom} from '../../session'
import {myOffersAtom} from './myOffers'

export const ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner =
  atom(null, (get, set) =>
    pipe(
      get(myOffersAtom),
      Array.filter(
        (one) =>
          !one.offerInfo.privatePart.adminId ||
          !one.offerInfo.privatePart.intendedConnectionLevel
      ),
      (offersToUpdate) => {
        console.log(
          `Updating offers to include owner info in owner's private payload. Count: ${offersToUpdate.length}`
        )
        return offersToUpdate
      },
      Array.map((one) =>
        pipe(
          updateOwnerPrivatePayload({
            api: get(apiAtom).offer,
            ownerCredentials: get(sessionDataOrDummyAtom).privateKey,
            ownerKeyPairV2: get(sessionDataOrDummyAtom).keyPairV2,
            symmetricKey: one.offerInfo.privatePart.symmetricKey,
            adminId: one.ownershipInfo.adminId,
            intendedConnectionLevel: one.ownershipInfo.intendedConnectionLevel,
            intendedClubs: one.ownershipInfo.intendedClubs ?? [],
          }),
          Effect.tapError((e) =>
            reportErrorE(
              'warn',
              new Error('Error updating owner private payload'),
              {e}
            )
          ),
          Effect.ignore
        )
      ),
      Effect.all
    )
  )
