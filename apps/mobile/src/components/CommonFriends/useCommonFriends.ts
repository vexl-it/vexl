import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {trustedFriendsEnabledAtom} from '../../state/deviceConfig'
import {orderFriendsByTrust} from './orderFriendsByTrust'

export function useCommonFriends(
  hashes: readonly HashedPhoneNumber[],
  verifiedHashes: readonly HashedPhoneNumber[] | undefined
): ReturnType<typeof orderFriendsByTrust<StoredContactWithComputedValues>> {
  const enabled = useAtomValue(trustedFriendsEnabledAtom)
  const friends = useAtomValue(
    useMemo(() => createImportedContactsForHashesAtom(hashes), [hashes])
  )
  return useMemo(
    () => orderFriendsByTrust(friends, verifiedHashes ?? [], enabled),
    [friends, verifiedHashes, enabled]
  )
}
