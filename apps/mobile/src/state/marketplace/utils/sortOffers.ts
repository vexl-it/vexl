import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  type OneOfferInState,
  type Sort,
} from '@vexl-next/domain/src/general/offers'
import {deriveVisibleCommonFriendsForOffer} from './visibleCommonFriends'

export default function sortOffers<T extends OneOfferInState>(
  offers: readonly T[],
  sort: Sort,
  importedContactsHashes?: readonly HashedPhoneNumber[]
): T[] {
  const toReturn = [...offers]
  const commonFriendsCounts =
    sort === 'MOST_CONNECTIONS' ? new Map<OneOfferInState, number>() : undefined

  if (commonFriendsCounts !== undefined) {
    for (const offer of toReturn) {
      commonFriendsCounts.set(
        offer,
        importedContactsHashes === undefined
          ? 0
          : deriveVisibleCommonFriendsForOffer({
              offerInfo: offer.offerInfo,
              importedContactsHashes,
            }).commonFriends.length
      )
    }
  }

  toReturn.sort((a, b) => {
    if (sort === 'LOWEST_FEE_FIRST')
      return a.offerInfo.publicPart.feeAmount - b.offerInfo.publicPart.feeAmount
    if (sort === 'HIGHEST_FEE')
      return b.offerInfo.publicPart.feeAmount - a.offerInfo.publicPart.feeAmount
    if (sort === 'NEWEST_OFFER') return b.offerInfo.id - a.offerInfo.id
    if (sort === 'OLDEST_OFFER') return a.offerInfo.id - b.offerInfo.id
    if (sort === 'LOWEST_AMOUNT')
      return (
        a.offerInfo.publicPart.amountTopLimit -
        b.offerInfo.publicPart.amountTopLimit
      )
    if (sort === 'HIGHEST_AMOUNT')
      return (
        b.offerInfo.publicPart.amountTopLimit -
        a.offerInfo.publicPart.amountTopLimit
      )
    if (sort === 'MOST_CONNECTIONS') {
      const aCommonFriendsCount = commonFriendsCounts?.get(a) ?? 0
      const bCommonFriendsCount = commonFriendsCounts?.get(b) ?? 0
      return bCommonFriendsCount - aCommonFriendsCount
    }
    // default ordering: NEWEST_OFFER
    return b.offerInfo.id - a.offerInfo.id
  })
  return toReturn // fallback. Let's return original array in case of invalid sort
}
