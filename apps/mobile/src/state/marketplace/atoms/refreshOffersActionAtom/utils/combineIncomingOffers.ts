import {
  type OfferInfo,
  type OfferPrivatePart,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option} from 'effect'
import reportError from '../../../../../utils/reportError'

export function combineIncomingOffers([
  offerA,
  offerB,
  ...rest
]: Array.NonEmptyArray<OfferInfo>): Option.Option<OfferInfo> {
  if (!offerB) return Option.some(offerA)

  if (offerA.offerId !== offerB.offerId) {
    reportError('error', new Error('Combining offers with different ids'), {
      ids: [offerA.offerId, offerB.offerId],
    })
    return Option.none()
  }

  const [newestOffer, olderOffer] =
    offerA.modifiedAt >= offerB.modifiedAt ? [offerA, offerB] : [offerB, offerA]

  const combinedPrivateParts: OfferPrivatePart = {
    ...newestOffer.privatePart,
    commonFriends: Array.union(
      newestOffer.privatePart.commonFriends,
      olderOffer.privatePart.commonFriends
    ),
    friendLevel: Array.union(
      newestOffer.privatePart.friendLevel,
      olderOffer.privatePart.friendLevel
    ),
    clubIds: Array.union(
      newestOffer.privatePart.clubIds,
      olderOffer.privatePart.clubIds
    ),
    adminId: newestOffer.privatePart.adminId ?? olderOffer.privatePart.adminId,
    intendedClubs:
      newestOffer.privatePart.intendedClubs ??
      olderOffer.privatePart.intendedClubs,
    intendedConnectionLevel:
      newestOffer.privatePart.intendedConnectionLevel ??
      olderOffer.privatePart.intendedConnectionLevel,
  }

  const combinedOffer: OfferInfo = {
    ...newestOffer,
    privatePart: combinedPrivateParts,
  }
  return combineIncomingOffers([combinedOffer, ...rest])
}
