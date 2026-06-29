import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {Array} from 'effect'

export interface VisibleCommonFriends {
  readonly commonFriends: readonly HashedPhoneNumber[]
  readonly verifiedCommonFriends: readonly HashedPhoneNumber[]
}

export function deriveVisibleCommonFriendsFromHashes({
  commonFriends,
  verifiedCommonFriends = [],
  importedContactsHashes,
}: {
  readonly commonFriends: readonly HashedPhoneNumber[]
  readonly verifiedCommonFriends?: readonly HashedPhoneNumber[]
  readonly importedContactsHashes: readonly HashedPhoneNumber[]
}): VisibleCommonFriends {
  const visibleCommonFriends = Array.intersection(
    Array.union(commonFriends, verifiedCommonFriends),
    importedContactsHashes
  )

  return {
    commonFriends: visibleCommonFriends,
    verifiedCommonFriends: Array.intersection(
      verifiedCommonFriends,
      importedContactsHashes
    ),
  }
}

export function deriveVisibleCommonFriendsForOffer({
  offerInfo,
  importedContactsHashes,
}: {
  readonly offerInfo: OfferInfo
  readonly importedContactsHashes: readonly HashedPhoneNumber[]
}): VisibleCommonFriends {
  return deriveVisibleCommonFriendsFromHashes({
    commonFriends: offerInfo.privatePart.commonFriends,
    verifiedCommonFriends: offerInfo.privatePart.verifiedCommonFriends,
    importedContactsHashes,
  })
}

export function deriveVisibleCommonFriendsForChat({
  commonFriends,
  verifiedCommonFriends,
  importedContactsHashes,
}: {
  readonly commonFriends: readonly HashedPhoneNumber[] | undefined
  readonly verifiedCommonFriends: readonly HashedPhoneNumber[] | undefined
  readonly importedContactsHashes: readonly HashedPhoneNumber[]
}): VisibleCommonFriends {
  return deriveVisibleCommonFriendsFromHashes({
    commonFriends: commonFriends ?? [],
    verifiedCommonFriends: verifiedCommonFriends ?? [],
    importedContactsHashes,
  })
}
