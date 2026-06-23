import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'

export function isProductOfferMissingCategory(offer: OneOfferInState): boolean {
  const {listingType, productCategory, productCategories} =
    offer.offerInfo.publicPart

  return (
    listingType === 'PRODUCT' &&
    productCategory === undefined &&
    !pipe(productCategories ?? [], Array.fromIterable, Array.isNonEmptyArray)
  )
}
