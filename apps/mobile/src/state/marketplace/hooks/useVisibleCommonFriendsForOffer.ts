import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {useAtomValue} from 'jotai'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {
  deriveVisibleCommonFriendsForOffer,
  type VisibleCommonFriends,
} from '../utils/visibleCommonFriends'

export function useVisibleCommonFriendsForOffer(
  offerInfo: OfferInfo
): VisibleCommonFriends {
  const importedContactsHashes = useAtomValue(importedContactsHashesAtom)

  // deriveVisibleCommonFriendsForOffer is memoized per offer + contacts change
  // and returns a stable reference, so no useMemo is needed here.
  return deriveVisibleCommonFriendsForOffer({
    offerInfo,
    importedContactsHashes,
  })
}
