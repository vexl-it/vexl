import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {useAtomValue} from 'jotai'
import {showVerifiedContactsAtom} from '../../../utils/preferences'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {
  applyTrustedFriendsFeatureFlag,
  deriveVisibleCommonFriendsForOffer,
  type VisibleCommonFriends,
} from '../utils/visibleCommonFriends'

export function useVisibleCommonFriendsForOffer(
  offerInfo: OfferInfo
): VisibleCommonFriends {
  const importedContactsHashes = useAtomValue(importedContactsHashesAtom)

  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)

  // deriveVisibleCommonFriendsForOffer is memoized per offer + contacts change
  // and returns a stable reference, so no useMemo is needed here.
  return applyTrustedFriendsFeatureFlag(
    deriveVisibleCommonFriendsForOffer({offerInfo, importedContactsHashes}),
    showVerifiedContacts
  )
}
