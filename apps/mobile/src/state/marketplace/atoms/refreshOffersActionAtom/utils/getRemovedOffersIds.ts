import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type NearbyOfferKey,
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {getRemovedNearbyOffers} from '@vexl-next/resources-utils/src/offers/nearby/getRemovedNearbyOffers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Option, pipe, Record} from 'effect'
import reportError from '../../../../../utils/reportError'
import {type ClubKeys} from '../../../../clubs/atom/clubsToKeyHolderV2Atom'

export const getRemovedOffersIds = ({
  storedOffers,
  offersApi,
  storedClubs,
  nearbyKeysByOfferId,
}: {
  storedOffers: OneOfferInState[]
  offersApi: OfferApi
  storedClubs: Record<ClubUuid, ClubKeys>
  nearbyKeysByOfferId: Record<OfferId, NearbyOfferKey>
}): Effect.Effect<{
  removedContactOfferIds: readonly OfferId[]
  removedClubsOfferIdsToClubUuid: ReadonlyArray<{
    clubUuid: ClubUuid
    removedIds: readonly OfferId[]
  }>
  removedNearbyOfferIds: readonly OfferId[]
  // False when any removed-offer check failed and was swallowed, so callers can
  // avoid recording a failed reconciliation as successful.
  succeeded: boolean
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

  // Each check is turned into an Option: None marks a swallowed failure so the
  // overall `succeeded` flag can tell an empty-because-successful result apart
  // from an empty-because-failed one.
  const removedContactOffers = pipe(
    Array.isNonEmptyArray(savedContactOffersIds)
      ? offersApi
          .getRemovedOffers({offerIds: savedContactOffersIds})
          .pipe(Effect.map((one) => one.offerIds))
      : Effect.succeed<readonly OfferId[]>([]),
    Effect.tapError((e) =>
      Effect.sync(() => {
        reportError('error', new Error('Error fetching removed offers'), {e})
      })
    ),
    Effect.option
  )

  const removedClubsOffers = pipe(
    clubOffersIds,
    Array.map(({clubKey, clubUuid, offersIds}) =>
      offersApi
        .getRemovedClubOffers({
          offerIds: offersIds,
          keyPair: clubKey.oldKeyPair,
          keyPairV2: clubKey.keyPair,
        })
        .pipe(
          Effect.map((removedIds) => ({
            clubUuid,
            removedIds: removedIds.offerIds,
          })),
          Effect.option
        )
    ),
    Effect.all
  )

  const removedNearbyOffers = pipe(
    getRemovedNearbyOffers({
      offerApi: offersApi,
      keysByOfferId: nearbyKeysByOfferId,
    }),
    Effect.option
  )

  return Effect.all({
    contact: removedContactOffers,
    clubs: removedClubsOffers,
    nearby: removedNearbyOffers,
  }).pipe(
    Effect.map(({contact, clubs, nearby}) => ({
      removedContactOfferIds: Option.getOrElse(
        contact,
        (): readonly OfferId[] => []
      ),
      removedClubsOfferIdsToClubUuid: Array.getSomes(clubs),
      removedNearbyOfferIds: Option.getOrElse(
        nearby,
        (): readonly OfferId[] => []
      ),
      succeeded:
        Option.isSome(contact) &&
        Array.every(clubs, Option.isSome) &&
        Option.isSome(nearby),
    }))
  )
}
