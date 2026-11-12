import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type OfferInfo,
  type OfferPrivatePart,
  type SocialPartsByIdentity,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe, Record} from 'effect'
import reportError from '../../../../../utils/reportError'
import {
  contactSocialPartOf,
  socialPartsByIdentityOf,
} from '../../../../phoneNumbers/socialPartsByIdentity'

export interface OfferForIdentity {
  readonly identity: PublicKeyPemBase64
  readonly offerInfo: OfferInfo
}

export interface IncomingOffer {
  readonly offerInfo: OfferInfo
  // Only the contact parts, club parts are not received by an identity
  readonly socialPartsByIdentity: SocialPartsByIdentity
}

export function combineIncomingOffers([
  offerA,
  offerB,
  ...rest
]: Array.NonEmptyReadonlyArray<OfferInfo>): Option.Option<OfferInfo> {
  if (!offerB) return Option.some(offerA)

  if (offerA.offerId !== offerB.offerId) {
    reportError('error', new Error('Combining offers with different ids'), {
      ids: [offerA.offerId, offerB.offerId],
    })
    return Option.none()
  }
  const combinedPrivateParts: OfferPrivatePart = {
    ...offerA.privatePart,
    commonFriends: Array.union(
      offerA.privatePart.commonFriends,
      offerB.privatePart.commonFriends
    ),
    verifiedCommonFriends: Array.union(
      offerA.privatePart.verifiedCommonFriends,
      offerB.privatePart.verifiedCommonFriends
    ),
    friendLevel: Array.union(
      offerA.privatePart.friendLevel,
      offerB.privatePart.friendLevel
    ),
    clubIds: Array.union(
      offerA.privatePart.clubIds,
      offerB.privatePart.clubIds
    ),
    adminId: offerA.privatePart.adminId ?? offerB.privatePart.adminId,
    intendedClubs:
      offerA.privatePart.intendedClubs ?? offerB.privatePart.intendedClubs,
    intendedConnectionLevel:
      offerA.privatePart.intendedConnectionLevel ??
      offerB.privatePart.intendedConnectionLevel,
  }

  const combinedOffer: OfferInfo = {
    ...offerA,
    privatePart: combinedPrivateParts,
  }
  return combineIncomingOffers([combinedOffer, ...rest])
}

/**
 * One incoming offer per id from the parts every identity and club received.
 */
export const toIncomingOffers = ({
  contactOffers,
  clubOffers,
}: {
  contactOffers: readonly OfferForIdentity[]
  clubOffers: readonly OfferInfo[]
}): IncomingOffer[] => {
  const socialPartsByOfferId = pipe(
    contactOffers,
    Array.groupBy((one) => one.offerInfo.offerId),
    Record.map((received) =>
      socialPartsByIdentityOf(
        Array.filterMap(received, ({identity, offerInfo}) =>
          Option.map(contactSocialPartOf(offerInfo.privatePart), (part) => ({
            identity,
            part,
          }))
        )
      )
    )
  )

  return pipe(
    [...Array.map(contactOffers, (one) => one.offerInfo), ...clubOffers],
    Array.groupBy((one) => one.offerId),
    Record.values,
    Array.filterMap(combineIncomingOffers),
    Array.map((offerInfo) => ({
      offerInfo,
      socialPartsByIdentity: pipe(
        Record.get(socialPartsByOfferId, offerInfo.offerId),
        Option.getOrElse(() => Record.empty())
      ),
    }))
  )
}
