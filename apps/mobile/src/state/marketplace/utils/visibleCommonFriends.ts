import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'

export interface VisibleCommonFriends {
  readonly commonFriends: readonly HashedPhoneNumber[]
  readonly verifiedCommonFriends: readonly HashedPhoneNumber[]
}

// Builds the imported-contacts-hashes lookup Set once per hashes-array
// identity (i.e. once per contacts change) instead of scanning the array with
// Equal.equals for every friend of every offer.
const hashesSetForArrayCache = new WeakMap<
  readonly HashedPhoneNumber[],
  ReadonlySet<HashedPhoneNumber>
>()

function toHashesSet(
  hashes: readonly HashedPhoneNumber[]
): ReadonlySet<HashedPhoneNumber> {
  const cachedSet = hashesSetForArrayCache.get(hashes)
  if (cachedSet !== undefined) return cachedSet

  const hashesSet: ReadonlySet<HashedPhoneNumber> = new Set(hashes)
  hashesSetForArrayCache.set(hashes, hashesSet)
  return hashesSet
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
  const importedContactsHashesSet = toHashesSet(importedContactsHashes)

  return {
    commonFriends: pipe(
      Array.appendAll(commonFriends, verifiedCommonFriends),
      Array.filter((one) => importedContactsHashesSet.has(one)),
      // dedupe while preserving first-occurrence order
      (visibleHashes) => Array.fromIterable(new Set(visibleHashes))
    ),
    verifiedCommonFriends: Array.filter(verifiedCommonFriends, (one) =>
      importedContactsHashesSet.has(one)
    ),
  }
}

// Visible common friends for an offer only change when the offer or the
// imported contacts change, but they are read from multiple places (marketplace
// filter, sorting, text search, offer cards). Memoize per offerInfo identity so
// the work happens once per offer per input change.
const visibleCommonFriendsForOfferCache = new WeakMap<
  OfferInfo,
  {
    importedContactsHashesSet: ReadonlySet<HashedPhoneNumber>
    visibleCommonFriends: VisibleCommonFriends
  }
>()

export function deriveVisibleCommonFriendsForOffer({
  offerInfo,
  importedContactsHashes,
}: {
  readonly offerInfo: OfferInfo
  readonly importedContactsHashes: readonly HashedPhoneNumber[]
}): VisibleCommonFriends {
  const importedContactsHashesSet = toHashesSet(importedContactsHashes)
  const cached = visibleCommonFriendsForOfferCache.get(offerInfo)
  if (cached?.importedContactsHashesSet === importedContactsHashesSet)
    return cached.visibleCommonFriends

  const visibleCommonFriends = deriveVisibleCommonFriendsFromHashes({
    commonFriends: offerInfo.privatePart.commonFriends,
    verifiedCommonFriends: offerInfo.privatePart.verifiedCommonFriends,
    importedContactsHashes,
  })
  visibleCommonFriendsForOfferCache.set(offerInfo, {
    importedContactsHashesSet,
    visibleCommonFriends,
  })
  return visibleCommonFriends
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
