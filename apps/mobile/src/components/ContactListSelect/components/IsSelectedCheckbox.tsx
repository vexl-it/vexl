import {type Atom, useAtom} from 'jotai'
import Checkbox from '../../Checkbox'
import {useMemo} from 'react'
import {useMolecule} from 'bunshi/dist/react'
import {contactSelectMolecule} from '../atom'
import {type ContactNormalized} from '../../../state/contacts/domain'

function IsSelectedCheckbox({
  contactAtom,
}: {
  contactAtom: Atom<ContactNormalized>
}): JSX.Element {
  const {createSelectContactAtom} = useMolecule(contactSelectMolecule)

  const [isSelected, select] = useAtom(
    useMemo(
      () => createSelectContactAtom(contactAtom),
      [contactAtom, createSelectContactAtom]
    )
  )

  return (
    <Checkbox
      value={isSelected}
      onChange={(v) => {
        select(v)
      }}
    />
  )
}

export default IsSelectedCheckbox
