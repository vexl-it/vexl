import {useMolecule} from 'bunshi/dist/react'
import {useAtom, type Atom} from 'jotai'
import {useMemo} from 'react'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import Checkbox from '../../../../Checkbox'
import {contactSelectMolecule} from '../atom'

function IsSelectedCheckbox({
  contactAtom,
}: {
  contactAtom: Atom<StoredContactWithComputedValues>
}): JSX.Element {
  const {createSelectContactAtom} = useMolecule(contactSelectMolecule)

  const [isSelected, select] = useAtom(
    useMemo(
      () => createSelectContactAtom(contactAtom),
      [contactAtom, createSelectContactAtom]
    )
  )

  return <Checkbox value={isSelected} onChange={select} />
}

export default IsSelectedCheckbox
