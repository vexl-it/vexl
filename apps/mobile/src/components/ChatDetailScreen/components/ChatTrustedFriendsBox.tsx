import {TrustedFriendsBox} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {trustedFriendsLine} from '../../../utils/trustedFriendsText'
import useCommonFriendsChips from '../../CommonFriends/useCommonFriendsChips'
import useCommonFriendsContacts from '../../CommonFriends/useCommonFriendsContacts'
import {chatMolecule} from '../atoms'

export default function ChatTrustedFriendsBox(): React.ReactElement | null {
  const {t} = useTranslation()
  const {
    commonConnectionsHashesAtom,
    verifiedConnectionsHashesAtom,
    otherPersonRoleAtom,
  } = useMolecule(chatMolecule)
  const commonHashes = useAtomValue(commonConnectionsHashesAtom)
  const verifiedHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const role = useAtomValue(otherPersonRoleAtom)
  const {trustedFriends} = useCommonFriendsContacts(
    commonHashes,
    verifiedHashes
  )
  const friends = useCommonFriendsChips(trustedFriends, verifiedHashes)
  const text = trustedFriendsLine({
    names: Array.map(trustedFriends, (friend) => friend.info.name),
    role,
    t,
  })

  if (!text) return null
  return (
    <TrustedFriendsBox
      heading={t('commonFriends.trustedFriends')}
      friends={friends}
      text={text}
    />
  )
}
