import {type OneOfferInState} from '../domain'
import {type Sort} from '@vexl-next/domain/dist/general/offers'

export default function sortOffers(
  offers: OneOfferInState[],
  sort: Sort
): OneOfferInState[] {
  const toReturn = [...offers]

  if (sort === 'LOWEST_FEE_FIRST')
    return toReturn.sort(function (a: OneOfferInState, b: OneOfferInState) {
      return a.offerInfo.publicPart.feeAmount - b.offerInfo.publicPart.feeAmount
    })
  if (sort === 'HIGHEST_FEE')
    return toReturn.sort(function (a: OneOfferInState, b: OneOfferInState) {
      return b.offerInfo.publicPart.feeAmount - a.offerInfo.publicPart.feeAmount
    })
  if (sort === 'NEWEST_OFFER')
    return toReturn.sort(function (a: OneOfferInState, b: OneOfferInState) {
      return b.offerInfo.id - a.offerInfo.id
    })
  if (sort === 'OLDEST_OFFER')
    return toReturn.sort(function (a: OneOfferInState, b: OneOfferInState) {
      return a.offerInfo.id - b.offerInfo.id
    })
  if (sort === 'LOWEST_AMOUNT')
    return toReturn.sort(function (a: OneOfferInState, b: OneOfferInState) {
      return (
        a.offerInfo.publicPart.amountTopLimit -
        b.offerInfo.publicPart.amountTopLimit
      )
    })
  if (sort === 'HIGHEST_AMOUNT')
    return toReturn.sort(function (a: OneOfferInState, b: OneOfferInState) {
      return (
        b.offerInfo.publicPart.amountTopLimit -
        a.offerInfo.publicPart.amountTopLimit
      )
    })
  return toReturn // fallback. Let's return original array in case of invalid sort
}
