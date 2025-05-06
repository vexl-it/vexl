import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Option, pipe, Record} from 'effect'
import reportError from '../../../../../utils/reportError'

export const getRemovedOffersIds = ({
  storedOffers,
  offersApi,
  storedClubs,
}: {
  storedOffers: OneOfferInState[]
  offersApi: OfferApi
  storedClubs: Record<ClubUuid, PrivateKeyHolder>
}): Effect.Effect<{
  removedContactOfferIds: readonly OfferId[]
  removedClubsOfferIdsToClubUuid: ReadonlyArray<{
    clubUuid: ClubUuid
    removedIds: readonly OfferId[]
  }>
}> => {
  const savedContactOffersIds = pipe(
    Array.filter(
      storedOffers,
      (oneOffer) =>
        !oneOffer.ownershipInfo?.adminId && // Not my offers
        Array.intersection(oneOffer.offerInfo.privatePart.friendLevel, [
          'FIRST_DEGREE',
          'SECOND_DEGREE',
        ]).length > 0
    ),
    Array.map((o) => o.offerInfo.offerId)
  )

  const clubOffersIds = pipe(
    storedClubs,
    Record.toEntries,
    Array.filterMap(([clubUuid, clubKey]) => {
      const offersIds = pipe(
        Array.filter(
          storedOffers,
          (oneOffer) =>
            !oneOffer.ownershipInfo?.adminId && // Not my offers
            Array.contains(oneOffer.offerInfo.privatePart.clubIds, clubUuid)
        ),
        Array.map((o) => o.offerInfo.offerId)
      )
      if (Array.isNonEmptyArray(offersIds))
        return Option.some({clubUuid, offersIds, clubKey})
      return Option.none()
    })
  )

  return Effect.all({
    removedContactOfferIds: pipe(
      savedContactOffersIds.length > 0
        ? offersApi
            .getRemovedOffers({
              body: {offerIds: savedContactOffersIds},
            })
            .pipe(Effect.map((one) => one.offerIds))
        : Effect.succeed([] as readonly OfferId[]),
      Effect.catchAll((e) => {
        if (e._tag !== 'NetworkError')
          reportError('error', new Error('Error fetching removed offers'), {
            e,
          })

        return Effect.succeed([] as readonly OfferId[])
      })
    ),

    removedClubsOfferIdsToClubUuid: pipe(
      clubOffersIds,
      Array.map(({clubKey, clubUuid, offersIds}) =>
        offersApi
          .getRemovedClubOffers({
            offerIds: offersIds,
            keyPair: clubKey,
          })
          .pipe(
            Effect.map((removedIds) => ({
              clubUuid,
              removedIds: removedIds.offerIds,
            })),
            Effect.option
          )
      ),
      Effect.all,
      Effect.map(Array.getSomes)
    ),
  })
}
