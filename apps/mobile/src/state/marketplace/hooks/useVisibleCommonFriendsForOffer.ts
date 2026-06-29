import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {
  deriveVisibleCommonFriendsForOffer,
  type VisibleCommonFriends,
} from '../utils/visibleCommonFriends'

export function useVisibleCommonFriendsForOffer(
  offerInfo: OfferInfo
): VisibleCommonFriends {
  const importedContactsHashes = useAtomValue(importedContactsHashesAtom)

  return useMemo(
    () =>
      deriveVisibleCommonFriendsForOffer({
        offerInfo,
        importedContactsHashes,
      }),
    [importedContactsHashes, offerInfo]
  )
}
