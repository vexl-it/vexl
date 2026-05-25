import {Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {contactSelectMolecule} from '../atom'
import ContactsList from './ContactsList'
import ContactsListEmpty from './ContactsListEmpty'

function FilteredContacts(): React.ReactElement {
  const {
    contactsFilterAtom,
    newContactsToDisplayAtomsAtom,
    submittedContactsToDisplayAtomsAtom,
    nonSubmittedContactsToDisplayAtomsAtom,
    allContactsToDisplayAtomsAtom,
  } = useMolecule(contactSelectMolecule)
  const contactsFilter = useAtomValue(contactsFilterAtom)
  const toDisplay = useAtomValue(
    contactsFilter === 'new'
      ? newContactsToDisplayAtomsAtom
      : contactsFilter === 'submitted'
        ? submittedContactsToDisplayAtomsAtom
        : contactsFilter === 'nonSubmitted'
          ? nonSubmittedContactsToDisplayAtomsAtom
          : allContactsToDisplayAtomsAtom
  )

  return (
    <Stack f={1}>
      <Stack f={1} px="$5">
        {toDisplay.length > 0 && <ContactsList contacts={toDisplay} />}
        {toDisplay.length === 0 && <ContactsListEmpty />}
      </Stack>
    </Stack>
  )
}

export default FilteredContacts
