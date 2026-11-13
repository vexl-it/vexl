import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type OfferId,
  type OfferInfo,
  type OneOfferInState,
  type SocialPartsByIdentity,
} from '@vexl-next/domain/src/general/offers'
import extractOwnerInfoFromOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/extractOwnerInfoFromOwnerPrivatePayload'
import {Array, Option, pipe, Record} from 'effect'
import {
  contactSocialPartOf,
  storedSocialPartsByIdentity,
  unionOfSocialParts,
  withoutIdentities,
} from '../../../../phoneNumbers/socialPartsByIdentity'
import {offerWithoutSourceOrNone} from '../../../utils/offerWithoutSourceOrNone'
import {type IncomingOffer} from './combineIncomingOffers'

const withSocialParts = ({
  offerInfo,
  socialPartsByIdentity,
  clubLevelsFrom,
}: {
  offerInfo: OfferInfo
  socialPartsByIdentity: SocialPartsByIdentity
  clubLevelsFrom: ReadonlyArray<OfferInfo['privatePart']['friendLevel']>
}): OfferInfo => {
  const social = unionOfSocialParts(Record.values(socialPartsByIdentity))
  return {
    ...offerInfo,
    privatePart: {
      ...offerInfo.privatePart,
      commonFriends: social.commonFriends,
      verifiedCommonFriends: social.verifiedCommonFriends,
      friendLevel: Array.union(
        social.friendLevel,
        pipe(
          clubLevelsFrom,
          Array.flatten,
          Array.filter((level) => level === 'CLUB'),
          Array.dedupe
        )
      ),
    },
  }
}

/**
 * Each identity and club source has its own incremental cursor. Missing from
 * this batch does not mean revoked: unchanged sources are kept until removal
 * reconciliation. An identity's social fields are replaced as a whole, never
 * unioned with its stale friends or a previous connection level.
 */
function mergeOfferSources({
  stored,
  storedSocialParts,
  incoming,
  removedForIdentities,
}: {
  stored: OneOfferInState
  storedSocialParts: SocialPartsByIdentity
  incoming: IncomingOffer | undefined
  removedForIdentities: readonly PublicKeyPemBase64[]
}): OneOfferInState {
  if (incoming?.offerInfo.privatePart.adminId)
    return {...stored, offerInfo: incoming.offerInfo}

  const socialPartsByIdentity = withoutIdentities(
    {...storedSocialParts, ...incoming?.socialPartsByIdentity},
    removedForIdentities
  )
  const base = incoming?.offerInfo ?? stored.offerInfo
  const offerInfo = withSocialParts({
    offerInfo: base,
    socialPartsByIdentity,
    clubLevelsFrom: [
      stored.offerInfo.privatePart.friendLevel,
      base.privatePart.friendLevel,
    ],
  })

  return {
    ...stored,
    socialPartsByIdentity,
    offerInfo: {
      ...offerInfo,
      privatePart: {
        ...offerInfo.privatePart,
        clubIds: Array.union(
          stored.offerInfo.privatePart.clubIds,
          base.privatePart.clubIds
        ),
      },
    },
  }
}

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

const groupBySourceOfferIds = <S>(
  removed: ReadonlyArray<{source: S; removedIds: readonly OfferId[]}>
): Map<OfferId, S[]> => {
  const sourcesByOfferId = new Map<OfferId, S[]>()
  for (const {source, removedIds} of removed) {
    for (const offerId of removedIds) {
      const sources = sourcesByOfferId.get(offerId)
      if (sources !== undefined) sources.push(source)
      else sourcesByOfferId.set(offerId, [source])
    }
  }
  return sourcesByOfferId
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
  mainIdentity,
}: {
  incomingOffers: readonly IncomingOffer[]
  storedOffers: OneOfferInState[]
  removedOffersIds: {
    clubs: ReadonlyArray<{clubUuid: ClubUuid; removedIds: readonly OfferId[]}>
    // Offers that have no private part for the identity anymore
    contacts: ReadonlyArray<{
      identity: PublicKeyPemBase64
      removedIds: readonly OfferId[]
    }>
  }
  // Offers stored before identities were tracked came to this one
  mainIdentity: PublicKeyPemBase64
}): OneOfferInState[] => {
  const incomingOffersById = new Map(
    Array.map(incomingOffers, (one): [OfferId, IncomingOffer] => [
      one.offerInfo.offerId,
      one,
    ])
  )
  const storedOffersIds = new Set(
    Array.map(storedOffers, (one) => one.offerInfo.offerId)
  )
  const removedClubUuidsByOfferId = groupBySourceOfferIds(
    Array.map(removedOffersIds.clubs, (one) => ({
      source: one.clubUuid,
      removedIds: one.removedIds,
    }))
  )
  const removedIdentitiesByOfferId = groupBySourceOfferIds(
    Array.map(removedOffersIds.contacts, (one) => ({
      source: one.identity,
      removedIds: one.removedIds,
    }))
  )

  // Returns the same reference when the offer was not removed from any club
  // and is already normalized.
  const withoutRemovedClubsOrNone = (
    offer: OneOfferInState
  ): Option.Option<OneOfferInState> => {
    const removedFromClubs =
      removedClubUuidsByOfferId.get(offer.offerInfo.offerId) ?? []
    if (Array.isEmptyArray(removedFromClubs)) {
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
    return offerWithoutSourceOrNone(offer, removedFromClubs)
  }

  const mergedStoredOffers = Array.filterMap(storedOffers, (storedOffer) => {
    // Do not update or remove offers that are owned by current user.
    // They can be re-uploaded.
    if (storedOffer.ownershipInfo?.adminId) return Option.some(storedOffer)

    const incoming = incomingOffersById.get(storedOffer.offerInfo.offerId)
    const storedSocialParts = storedSocialPartsByIdentity({
      socialPartsByIdentity: storedOffer.socialPartsByIdentity,
      legacyPart: contactSocialPartOf(storedOffer.offerInfo.privatePart),
      mainIdentity,
    })
    const removedForIdentities = Array.filter(
      removedIdentitiesByOfferId.get(storedOffer.offerInfo.offerId) ?? [],
      (identity) => Record.has(storedSocialParts, identity)
    )
    const updatedOffer =
      incoming === undefined && Array.isEmptyArray(removedForIdentities)
        ? storedOffer
        : mergeOfferSources({
            stored: storedOffer,
            storedSocialParts,
            incoming,
            removedForIdentities,
          })

    return pipe(
      addOwnershipInfoFromPrivatePayloadIfMissing(updatedOffer),
      Option.flatMap(withoutRemovedClubsOrNone)
    )
  })

  const newOffers = pipe(
    incomingOffers,
    Array.filter((one) => !storedOffersIds.has(one.offerInfo.offerId)),
    Array.filterMap(({offerInfo, socialPartsByIdentity}) =>
      // Ownership first: the owner's own private part has no friend level,
      // so normalizing it as a foreign offer would drop it.
      pipe(
        addOwnershipInfoFromPrivatePayloadIfMissing({
          offerInfo,
          flags: {
            reported: false,
          },
          ...(offerInfo.privatePart.adminId ? {} : {socialPartsByIdentity}),
        } satisfies OneOfferInState),
        Option.flatMap(withoutRemovedClubsOrNone)
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
