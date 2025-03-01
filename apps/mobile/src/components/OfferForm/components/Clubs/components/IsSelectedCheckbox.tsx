import {useMolecule} from 'bunshi/dist/react'
import {useAtom, type Atom} from 'jotai'
import {useMemo} from 'react'
import Checkbox from '../../../../Checkbox'
import {type ClubWithMembers} from '../../../../CRUDOfferFlow/atoms/clubsWithMembersAtom'
import {offerFormMolecule} from '../../../../CRUDOfferFlow/atoms/offerFormStateAtoms'

function IsSelectedCheckbox({
  clubWithMembersAtom,
}: {
  clubWithMembersAtom: Atom<ClubWithMembers>
}): JSX.Element {
  const {createSelectClubAtom} = useMolecule(offerFormMolecule)

  const [isSelected, select] = useAtom(
    useMemo(
      () => createSelectClubAtom(clubWithMembersAtom),
      [clubWithMembersAtom, createSelectClubAtom]
    )
  )

  return <Checkbox value={isSelected} onChange={select} />
}

export default IsSelectedCheckbox
