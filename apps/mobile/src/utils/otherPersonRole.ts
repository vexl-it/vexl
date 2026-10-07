import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {getIsOffering} from './offerHelpers'

export type OtherPersonRole = 'seller' | 'buyer' | 'otherPerson'

export function getOtherPersonRole(
  offer: OneOfferInState | undefined
): OtherPersonRole {
  if (!offer) return 'otherPerson'

  const {listingType, offerType} = offer.offerInfo.publicPart
  const authorIsSeller = getIsOffering(listingType, offerType)
  const otherPersonIsSeller = offer.ownershipInfo
    ? !authorIsSeller
    : authorIsSeller

  return otherPersonIsSeller ? 'seller' : 'buyer'
}
