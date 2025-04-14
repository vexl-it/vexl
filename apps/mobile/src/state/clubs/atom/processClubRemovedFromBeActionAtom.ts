import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type MyOfferInState} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {deleteClubForAllConnectionsActionAtom} from '../../../state/connections/atom/offerToConnectionsAtom'
import {
  myOffersAtom,
  updateMyOfferPrivatePayloadActionAtom,
} from '../../../state/marketplace/atoms/myOffers'
import {updateOrFilterOffersFromDeletedClubsActionAtom} from '../../../state/marketplace/atoms/offersState'
import {ignoreReportErrors} from '../../../utils/reportError'
import {removeMyStoredClubFromStateActionAtom} from './clubsStore'

const deletePrivatePartsForOffers = (
  connectionsWithOffers: Array<{
    connections: readonly [PublicKeyPemBase64, ...PublicKeyPemBase64[]]
    offer: MyOfferInState
  }>,
  offerApi: OfferApi
): ReturnType<OfferApi['deletePrivatePart']> => {
  const adminIdsCombined = pipe(
    connectionsWithOffers,
    Array.map(({offer}) => offer.ownershipInfo.adminId)
  )
  const connectionsCombined = pipe(
    connectionsWithOffers,
    Array.map(({connections}) => connections),
    Array.flatten
  )
  return offerApi.deletePrivatePart({
    body: {
      adminIds: adminIdsCombined,
      publicKeys: connectionsCombined,
    },
  })
}

export const processClubRemovedFromBeActionAtom = atom(
  null,
  (
    get,
    set,
    {
      clubUuid,
    }: {
      clubUuid: ClubUuid
    }
  ) => {
    return Effect.gen(function* (_) {
      const offerApi = get(apiAtom).offer
      const offerConnectionsToDeleteFromServer = set(
        deleteClubForAllConnectionsActionAtom,
        clubUuid
      )

      const myOffersWithConnectionsForClub = pipe(
        get(myOffersAtom),
        Array.map(Option.some),
        Array.filterMap(
          Option.filter((oneOffer) =>
            Array.contains(oneOffer.ownershipInfo.intendedClubs ?? [], clubUuid)
          )
        ),
        Array.filterMap((oneOfferForClub) =>
          Array.findFirst(
            offerConnectionsToDeleteFromServer,
            (oneConnectionRecord) =>
              oneConnectionRecord.adminId ===
              oneOfferForClub.ownershipInfo.adminId
          ).pipe(
            Option.map(({connections}) => ({
              connections,
              offer: oneOfferForClub,
            }))
          )
        )
      )

      yield* _(
        deletePrivatePartsForOffers(myOffersWithConnectionsForClub, offerApi),
        ignoreReportErrors(
          'warn',
          'Unable to delete private parts for deleted club'
        )
      )

      yield* _(
        myOffersWithConnectionsForClub,
        Array.map(({offer}) =>
          set(updateMyOfferPrivatePayloadActionAtom, {
            adminId: offer.ownershipInfo.adminId,
            intendedConnectionLevel:
              offer.ownershipInfo.intendedConnectionLevel,
            intendedClubs: offer.ownershipInfo.intendedClubs
              ? Array.filter(
                  offer.ownershipInfo.intendedClubs,
                  (one) => one !== clubUuid
                )
              : [],
          })
        ),
        Array.map(
          ignoreReportErrors(
            'warn',
            'Unable to update owners private parts for deleted club'
          )
        ),
        Effect.all
      )
      set(removeMyStoredClubFromStateActionAtom, clubUuid)
      set(updateOrFilterOffersFromDeletedClubsActionAtom, [clubUuid])
    })
  }
)
