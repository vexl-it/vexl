import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import CommonFriends from '../../CommonFriends'
import {chatMolecule} from '../atoms'

export default function ChatCommonFriends(): React.ReactElement {
  const {
    commonConnectionsHashesAtom,
    verifiedConnectionsHashesAtom,
    otherSideClubsIdsAtom,
    otherPersonRoleAtom,
  } = useMolecule(chatMolecule)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
  const role = useAtomValue(otherPersonRoleAtom)
  const otherSideClubs = useGetAllClubsForIds(otherSideClubsIds ?? [])

  return (
    <CommonFriends
      commonConnectionsHashes={commonConnectionsHashes}
      verifiedConnectionsHashes={verifiedConnectionsHashes}
      otherSideClubs={otherSideClubs}
      role={role}
    />
  )
}
