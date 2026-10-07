import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array} from 'effect'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {showVerifiedContactsAtom} from '../../utils/preferences'

export default function useCommonFriendsContacts(
  commonHashes: readonly HashedPhoneNumber[],
  verifiedHashes: readonly HashedPhoneNumber[]
): {
  trustedFriends: StoredContactWithComputedValues[]
  otherCommonFriends: StoredContactWithComputedValues[]
} {
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)
  const contacts = useAtomValue(
    useMemo(
      () => createImportedContactsForHashesAtom(commonHashes),
      [commonHashes]
    )
  )

  return useMemo(() => {
    const trustedHashes = new Set(verifiedHashes)
    const [otherCommonFriends, trustedFriends] = Array.partition(
      contacts,
      (contact) =>
        showVerifiedContacts && trustedHashes.has(contact.computedValues.hash)
    )
    return {trustedFriends, otherCommonFriends}
  }, [contacts, verifiedHashes, showVerifiedContacts])
}
