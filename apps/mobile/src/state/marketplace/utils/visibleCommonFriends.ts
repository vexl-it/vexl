import {type ContactHash} from '@vexl-next/domain/src/general/ContactHash.brand'
import {type NoteInfo} from '@vexl-next/domain/src/general/notes'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'

export interface VisibleCommonFriends {
  readonly commonFriends: readonly ContactHash[]
  readonly verifiedCommonFriends: readonly ContactHash[]
}

// Builds the imported-contacts-hashes lookup Set once per hashes-array
// identity (i.e. once per contacts change) instead of scanning the array with
// Equal.equals for every friend of every offer.
const hashesSetForArrayCache = new WeakMap<
  readonly ContactHash[],
  ReadonlySet<ContactHash>
>()

function toHashesSet(hashes: readonly ContactHash[]): ReadonlySet<ContactHash> {
  const cachedSet = hashesSetForArrayCache.get(hashes)
  if (cachedSet !== undefined) return cachedSet

  const hashesSet: ReadonlySet<ContactHash> = new Set(hashes)
  hashesSetForArrayCache.set(hashes, hashesSet)
  return hashesSet
}

export function deriveVisibleCommonFriendsFromHashes({
  commonFriends,
  verifiedCommonFriends = [],
  importedContactsHashes,
}: {
  readonly commonFriends: readonly ContactHash[]
  readonly verifiedCommonFriends?: readonly ContactHash[]
  readonly importedContactsHashes: readonly ContactHash[]
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

// Visible common friends only change when the entity (offer/note) or the
// imported contacts change, but they are read from multiple places (marketplace
// filter, sorting, text search, cards). Memoize per entity identity so the
// work happens once per entity per input change.
function memoizePerEntityAndContacts<Entity extends object, Result>(
  derive: (
    entity: Entity,
    importedContactsHashes: readonly ContactHash[]
  ) => Result
): (entity: Entity, importedContactsHashes: readonly ContactHash[]) => Result {
  const cache = new WeakMap<
    Entity,
    {
      importedContactsHashesSet: ReadonlySet<ContactHash>
      result: Result
    }
  >()

  return (entity, importedContactsHashes) => {
    const importedContactsHashesSet = toHashesSet(importedContactsHashes)
    const cached = cache.get(entity)
    if (cached?.importedContactsHashesSet === importedContactsHashesSet)
      return cached.result

    const result = derive(entity, importedContactsHashes)
    cache.set(entity, {importedContactsHashesSet, result})
    return result
  }
}

const memoizedVisibleCommonFriendsForOffer = memoizePerEntityAndContacts(
  (offerInfo: OfferInfo, importedContactsHashes) =>
    deriveVisibleCommonFriendsFromHashes({
      commonFriends: offerInfo.privatePart.commonFriends,
      verifiedCommonFriends: offerInfo.privatePart.verifiedCommonFriends,
      importedContactsHashes,
    })
)

export function deriveVisibleCommonFriendsForOffer({
  offerInfo,
  importedContactsHashes,
}: {
  readonly offerInfo: OfferInfo
  readonly importedContactsHashes: readonly ContactHash[]
}): VisibleCommonFriends {
  return memoizedVisibleCommonFriendsForOffer(offerInfo, importedContactsHashes)
}

const memoizedVisibleCommonFriendsForNote = memoizePerEntityAndContacts(
  (noteInfo: NoteInfo, importedContactsHashes) =>
    Array.filter(noteInfo.privatePart.commonFriends, (one) =>
      toHashesSet(importedContactsHashes).has(one)
    )
)

export function deriveVisibleCommonFriendsForNote({
  noteInfo,
  importedContactsHashes,
}: {
  readonly noteInfo: NoteInfo
  readonly importedContactsHashes: readonly ContactHash[]
}): readonly ContactHash[] {
  return memoizedVisibleCommonFriendsForNote(noteInfo, importedContactsHashes)
}

export function deriveVisibleCommonFriendsForChat({
  commonFriends,
  verifiedCommonFriends,
  importedContactsHashes,
}: {
  readonly commonFriends: readonly ContactHash[] | undefined
  readonly verifiedCommonFriends: readonly ContactHash[] | undefined
  readonly importedContactsHashes: readonly ContactHash[]
}): VisibleCommonFriends {
  return deriveVisibleCommonFriendsFromHashes({
    commonFriends: commonFriends ?? [],
    verifiedCommonFriends: verifiedCommonFriends ?? [],
    importedContactsHashes,
  })
}
