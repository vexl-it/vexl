import {useFocusEffect} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import * as O from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import {type ContactsTabScreenProps} from '../../../../../navigationTypes'
import {contactSelectMolecule} from '../atom'
import AddContactRow from './AddContactRow'
import ContactsList from './ContactsList'
import ContactsListEmpty from './ContactsListEmpty'

type Props = ContactsTabScreenProps<'Submitted' | 'NonSubmitted' | 'New'>

function FilteredContacts({
  route: {
    params: {filter},
  },
}: Props): JSX.Element {
  const {
    contactsFilterAtom,
    searchTextAsCustomContactAtom,
    newContactsToDisplayAtomsAtom,
    submittedContactsToDisplayAtomsAtom,
    nonSubmittedContactsToDisplayAtomsAtom,
  } = useMolecule(contactSelectMolecule)
  const customContactToAdd = useAtomValue(searchTextAsCustomContactAtom)
  const toDisplay = useAtomValue(
    filter === 'new'
      ? newContactsToDisplayAtomsAtom
      : filter === 'submitted'
        ? submittedContactsToDisplayAtomsAtom
        : nonSubmittedContactsToDisplayAtomsAtom
  )

  const setContactsFilter = useSetAtom(contactsFilterAtom)

  useFocusEffect(
    useCallback(() => {
      setContactsFilter(filter)
    }, [filter, setContactsFilter])
  )

  return (
    <Stack f={1}>
      <Stack f={1} px="$4">
        {toDisplay.length > 0 && <ContactsList contacts={toDisplay} />}
        {toDisplay.length === 0 && !O.isSome(customContactToAdd) && (
          <ContactsListEmpty />
        )}
        {toDisplay.length === 0 && O.isSome(customContactToAdd) && (
          <AddContactRow contact={customContactToAdd.value} />
        )}
      </Stack>
    </Stack>
  )
}

export default FilteredContacts
