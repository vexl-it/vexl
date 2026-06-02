import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'

export function getUserFacingOfferType({
  listingType,
  offerType,
}: {
  readonly listingType: ListingType | undefined
  readonly offerType: OfferType
}): OfferType {
  if (!listingType || listingType === 'BITCOIN') return offerType

  // Product/service public offerType keeps the old Bitcoin-leg meaning:
  // selling a product/service means buying BTC, and seeking one means selling
  // BTC. This conversion is symmetric, so use it before persisting a
  // user-facing choice and before rendering a persisted value.
  return offerType === 'BUY' ? 'SELL' : 'BUY'
}
