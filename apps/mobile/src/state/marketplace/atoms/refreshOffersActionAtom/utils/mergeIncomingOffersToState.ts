import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type OfferId,
  type OfferInfo,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import extractOwnerInfoFromOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/extractOwnerInfoFromOwnerPrivatePayload'
import {Array, Option, pipe} from 'effect'
import {offerWithoutSourceOrNone} from '../../../utils/offerWithoutSourceOrNone'

// Process offers that have adminId in private part but do not have ownershipInfo.
// Returns the same reference when there is nothing to extract, and None when
// the private part has adminId but ownership info can not be extracted (data
// written by older clients) — such offers are dropped from state so they do
// not linger forever as ghost "foreign" offers.
const addOwnershipInfoFromPrivatePayloadIfMissing = (
  offer: OneOfferInState
): Option.Option<OneOfferInState> => {
  if (!offer.ownershipInfo && !!offer.offerInfo.privatePart.adminId) {
    // TODO handle offerToConnections
    return pipe(
      extractOwnerInfoFromOwnerPrivatePayload(offer.offerInfo.privatePart),
      Option.map((ownershipInfo) => ({...offer, ownershipInfo}))
    )
  }
  return Option.some(offer)
}

/**
 * Merges incoming offers into the stored offers in O(stored + incoming).
 *
 * When the refresh changes nothing, the SAME `storedOffers` array reference is
 * returned (and unchanged offers keep their object identity), so callers can
 * skip persisting and downstream derived atoms are not invalidated.
 */
export const mergeIncomingOffersToState = ({
  incomingOffers,
  storedOffers,
  removedOffersIds,
}: {
  incomingOffers: readonly OfferInfo[]
  storedOffers: OneOfferInState[]
  removedOffersIds: {
    clubs: ReadonlyArray<{clubUuid: ClubUuid; removedIds: readonly OfferId[]}>
    contacts: readonly OfferId[]
  }
}): OneOfferInState[] => {
  const incomingOffersById = new Map(
    Array.map(incomingOffers, (one): [OfferId, OfferInfo] => [one.offerId, one])
  )
  const storedOffersIds = new Set(
    Array.map(storedOffers, (one) => one.offerInfo.offerId)
  )
  const removedContactsOfferIds = new Set(removedOffersIds.contacts)
  const removedClubUuidsByOfferId = new Map<OfferId, ClubUuid[]>()
  for (const {clubUuid, removedIds} of removedOffersIds.clubs) {
    for (const offerId of removedIds) {
      const clubsForOffer = removedClubUuidsByOfferId.get(offerId)
      if (clubsForOffer !== undefined) clubsForOffer.push(clubUuid)
      else removedClubUuidsByOfferId.set(offerId, [clubUuid])
    }
  }

  // Returns the same reference when the offer was not removed from any source
  // and is already normalized.
  const withoutRemovedSourcesOrNone = (
    offer: OneOfferInState
  ): Option.Option<OneOfferInState> => {
    const removedFromClubs =
      removedClubUuidsByOfferId.get(offer.offerInfo.offerId) ?? []
    const removedFromContacts = removedContactsOfferIds.has(
      offer.offerInfo.offerId
    )
    if (Array.isEmptyArray(removedFromClubs) && !removedFromContacts) {
      // Nothing was removed, but keep normalizing degenerate offers (no
      // friend level left, or CLUB friend level with no clubs) the same way
      // the removal path does, so they do not survive in state forever.
      const {clubIds, friendLevel} = offer.offerInfo.privatePart
      const isNormalized =
        Array.isNonEmptyReadonlyArray(friendLevel) &&
        (!Array.contains(friendLevel, 'CLUB') ||
          Array.isNonEmptyReadonlyArray(clubIds))
      if (isNormalized) return Option.some(offer)
    }
    return offerWithoutSourceOrNone(
      offer,
      removedFromClubs,
      removedFromContacts
    )
  }

  const mergedStoredOffers = Array.filterMap(storedOffers, (storedOffer) => {
    // Do not update or remove offers that are owned by current user.
    // They can be re-uploaded.
    if (storedOffer.ownershipInfo?.adminId) return Option.some(storedOffer)

    const incomingOffer = incomingOffersById.get(storedOffer.offerInfo.offerId)
    const updatedOffer =
      incomingOffer !== undefined
        ? ({
            ...storedOffer,
            offerInfo: incomingOffer,
          } satisfies OneOfferInState)
        : storedOffer

    return pipe(
      withoutRemovedSourcesOrNone(updatedOffer),
      Option.flatMap(addOwnershipInfoFromPrivatePayloadIfMissing)
    )
  })

  const newOffers = pipe(
    incomingOffers,
    Array.filter((one) => !storedOffersIds.has(one.offerId)),
    Array.filterMap((offerInfo) =>
      pipe(
        withoutRemovedSourcesOrNone({
          offerInfo,
          flags: {
            reported: false,
          },
        } satisfies OneOfferInState),
        Option.flatMap(addOwnershipInfoFromPrivatePayloadIfMissing)
      )
    )
  )

  // No-op refresh: keep the original array reference so nothing downstream
  // invalidates and the persisted store is not rewritten.
  if (
    Array.isEmptyArray(newOffers) &&
    mergedStoredOffers.length === storedOffers.length &&
    Array.every(mergedStoredOffers, (one, i) => one === storedOffers[i])
  )
    return storedOffers

  return [...mergedStoredOffers, ...newOffers]
}
