import {Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {contactSelectMolecule} from '../atom'
import AddContactRow from './AddContactRow'
import ContactsList from './ContactsList'
import ContactsListEmpty from './ContactsListEmpty'

function FilteredContacts(): React.ReactElement {
  const {
    contactsFilterAtom,
    searchTextAsCustomContactAtom,
    newContactsToDisplayAtomsAtom,
    submittedContactsToDisplayAtomsAtom,
    nonSubmittedContactsToDisplayAtomsAtom,
    allContactsToDisplayAtomsAtom,
  } = useMolecule(contactSelectMolecule)
  const customContactToAdd = useAtomValue(searchTextAsCustomContactAtom)
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
        {toDisplay.length === 0 && Option.isNone(customContactToAdd) && (
          <ContactsListEmpty />
        )}
        {toDisplay.length === 0 && Option.isSome(customContactToAdd) && (
          <AddContactRow contact={customContactToAdd.value} />
        )}
      </Stack>
    </Stack>
  )
}

export default FilteredContacts
