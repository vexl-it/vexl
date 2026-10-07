import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type CommonFriend} from '@vexl-next/ui'
import {Array, HashMap, Option, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {showVerifiedContactsAtom} from '../../utils/preferences'
import useContactImageSources from './useContactImageSources'

export default function useCommonFriendsChips(
  contacts: readonly StoredContactWithComputedValues[],
  verifiedHashes: readonly HashedPhoneNumber[]
): readonly CommonFriend[] {
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)
  const imageSources = useContactImageSources(contacts)
  return useMemo(() => {
    const trustedHashes = new Set(verifiedHashes)
    return pipe(
      contacts,
      Array.map((friend) => ({
        id: friend.computedValues.hash,
        name: friend.info.name,
        trusted:
          showVerifiedContacts && trustedHashes.has(friend.computedValues.hash),
        avatarSource: Option.getOrUndefined(
          HashMap.get(imageSources, friend.computedValues.hash)
        ),
      }))
    )
  }, [contacts, verifiedHashes, imageSources, showVerifiedContacts])
}
