import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array} from 'effect'

export function isProductOfferMissingCategory(offer: OneOfferInState): boolean {
  const {listingType, productCategory, productCategories} =
    offer.offerInfo.publicPart

  return (
    listingType === 'PRODUCT' &&
    productCategory === undefined &&
    !Array.isNonEmptyReadonlyArray(productCategories ?? [])
  )
}
