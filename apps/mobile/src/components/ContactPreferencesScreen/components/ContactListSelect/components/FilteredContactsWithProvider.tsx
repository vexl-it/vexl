import {Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {runAfterAnimationFrame} from '../../../../../utils/runAfterAnimationFrames'
import {contactSelectMolecule} from '../atom'
import ContactsList from './ContactsList'
import ContactsListEmpty from './ContactsListEmpty'

function FilteredContacts(): React.ReactElement {
  const {
    contactsFilterAtom,
    searchTextAtom,
    readyContactsQueryAtom,
    contactsToDisplayAtomsAtom,
  } = useMolecule(contactSelectMolecule)
  const contactsFilter = useAtomValue(contactsFilterAtom)
  const searchText = useAtomValue(searchTextAtom)
  const toDisplay = useAtomValue(contactsToDisplayAtomsAtom)
  const setReadyContactsQuery = useSetAtom(readyContactsQueryAtom)

  useEffect(() => {
    return runAfterAnimationFrame(() => {
      setReadyContactsQuery({contactsFilter, searchText})
    })
  }, [contactsFilter, searchText, setReadyContactsQuery, toDisplay])

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
