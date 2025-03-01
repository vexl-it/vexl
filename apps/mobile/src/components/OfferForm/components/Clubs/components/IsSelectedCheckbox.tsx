import {type Atom, useAtom, type WritableAtom} from 'jotai'
import {type SetStateAction, useMemo} from 'react'
import Checkbox from '../../../../Checkbox'
import {type ClubWithMembers} from '../../../../CRUDOfferFlow/atoms/clubsWithMembersAtom'

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
