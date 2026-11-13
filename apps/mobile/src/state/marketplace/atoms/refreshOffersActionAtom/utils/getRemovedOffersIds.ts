import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubKeys, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Option, pipe, Record} from 'effect'
import reportError from '../../../../../utils/reportError'
import {
  contactSocialPartOf,
  storedSocialPartsByIdentity,
} from '../../../../phoneNumbers/socialPartsByIdentity'

/**
 * Asks each identity only about the offers it received. An offer is gone from
 * contacts once no identity has a private part for it anymore.
 */
export const getRemovedOffersIds = ({
  storedOffers,
  offersApi,
  contactOffersApis,
  mainIdentity,
  storedClubs,
}: {
  storedOffers: OneOfferInState[]
  // For club offers
  offersApi: OfferApi
  contactOffersApis: ReadonlyArray<{
    identity: PublicKeyPemBase64
    offersApi: OfferApi
  }>
  mainIdentity: PublicKeyPemBase64
  storedClubs: Record<ClubUuid, ClubKeys>
}): Effect.Effect<{
  removedContactOfferIds: ReadonlyArray<{
    identity: PublicKeyPemBase64
    removedIds: readonly OfferId[]
  }>
  removedClubsOfferIdsToClubUuid: ReadonlyArray<{
    clubUuid: ClubUuid
    removedIds: readonly OfferId[]
  }>
  // False when any removed-offer check failed and was swallowed, so callers can
  // avoid recording a failed reconciliation as successful.
  succeeded: boolean
}> => {
  const foreignOffers = Array.filter(
    storedOffers,
    (oneOffer) => !oneOffer.ownershipInfo?.adminId // Not my offers
  )
  const savedContactOffersIdsOf = (identity: PublicKeyPemBase64): OfferId[] =>
    pipe(
      foreignOffers,
      Array.filter((oneOffer) =>
        Record.has(
          storedSocialPartsByIdentity({
            socialPartsByIdentity: oneOffer.socialPartsByIdentity,
            legacyPart: contactSocialPartOf(oneOffer.offerInfo.privatePart),
            mainIdentity,
          }),
          identity
        )
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
  const removedContactOffers = Effect.all(
    Array.map(contactOffersApis, ({identity, offersApi}) => {
      const savedContactOffersIds = savedContactOffersIdsOf(identity)
      return pipe(
        Array.isNonEmptyArray(savedContactOffersIds)
          ? offersApi
              .getRemovedOffers({offerIds: savedContactOffersIds})
              .pipe(Effect.map((one) => one.offerIds))
          : Effect.succeed<readonly OfferId[]>([]),
        Effect.map((removedIds) => ({identity, removedIds})),
        Effect.tapError((e) =>
          Effect.sync(() => {
            reportError('error', new Error('Error fetching removed offers'), {
              e,
            })
          })
        ),
        Effect.option
      )
    }),
    {concurrency: 'unbounded'}
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

  return Effect.all({
    contact: removedContactOffers,
    clubs: removedClubsOffers,
  }).pipe(
    Effect.map(({contact, clubs}) => ({
      removedContactOfferIds: Array.getSomes(contact),
      removedClubsOfferIdsToClubUuid: Array.getSomes(clubs),
      succeeded:
        Array.every(contact, Option.isSome) &&
        Array.every(clubs, Option.isSome),
    }))
  )
}
