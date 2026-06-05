import {type OfferPublicPart} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'

export function formatOfferPublicPart(
  publicPart: OfferPublicPart
): OfferPublicPart {
  const {
    amountBottomLimit,
    amountTopLimit,
    feeAmount,
    feeState,
    location,
    locationState,
    listingType,
    offerDescription,
    ...restOfPublicPart
  } = publicPart
  const isBitcoinListing = listingType === 'BITCOIN'
  const shouldSendLocation = pipe(
    locationState,
    Array.some((state) => state === 'IN_PERSON')
  )

  return {
    ...restOfPublicPart,
    listingType,
    location: shouldSendLocation ? location : [],
    locationState,
    amountBottomLimit,
    amountTopLimit: isBitcoinListing ? amountTopLimit : amountBottomLimit,
    feeAmount: isBitcoinListing ? feeAmount : 0,
    feeState: isBitcoinListing ? feeState : 'WITHOUT_FEE',
    offerDescription: offerDescription.trim(),
  }
}
