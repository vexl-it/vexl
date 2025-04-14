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
  const combinedPrivateParts: OfferPrivatePart = {
    ...offerA.privatePart,
    commonFriends: Array.union(
      offerA.privatePart.commonFriends,
      offerB.privatePart.commonFriends
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
