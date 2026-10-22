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

export type OtherSideRole = 'seller' | 'buyer' | 'otherSide'

export function getOtherSideRole({
  offer,
  otherSideIsAuthor = true,
}: {
  readonly offer?: {
    readonly listingType?: ListingType
    readonly offerType: OfferType
  }
  readonly otherSideIsAuthor?: boolean
}): OtherSideRole {
  if (!offer) return 'otherSide'

  const authorIsSeller =
    getUserFacingOfferType({
      listingType: offer.listingType,
      offerType: offer.offerType,
    }) === 'SELL'
  return authorIsSeller === otherSideIsAuthor ? 'seller' : 'buyer'
}
