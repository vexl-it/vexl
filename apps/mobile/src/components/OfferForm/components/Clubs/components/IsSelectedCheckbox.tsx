import {useAtom, type Atom, type WritableAtom} from 'jotai'
import {useMemo, type SetStateAction} from 'react'
import {type ClubWithMembers} from '../../../../../state/clubs/atom/clubsWithMembersAtom'
import Checkbox from '../../../../Checkbox'

function IsSelectedCheckbox({
  clubWithMembersAtom,
  createSelectClubAtom,
}: {
  clubWithMembersAtom: Atom<ClubWithMembers>
  createSelectClubAtom: (
    clubWithMembersAtom: Atom<ClubWithMembers>
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}): JSX.Element {
  const [isSelected, select] = useAtom(
    useMemo(
      () => createSelectClubAtom(clubWithMembersAtom),
      [clubWithMembersAtom, createSelectClubAtom]
    )
  )

  return <Checkbox value={isSelected} onChange={select} />
}

export default IsSelectedCheckbox
