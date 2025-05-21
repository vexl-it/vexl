import {useFocusEffect} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import {type ContactsTabScreenProps} from '../../../../../navigationTypes'
import {contactSelectMolecule} from '../atom'
import AddContactRow from './AddContactRow'
import ContactsList from './ContactsList'
import ContactsListEmpty from './ContactsListEmpty'

type Props = ContactsTabScreenProps<
  'Submitted' | 'NonSubmitted' | 'New' | 'All'
>

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
    allContactsToDisplayAtomsAtom,
  } = useMolecule(contactSelectMolecule)
  const customContactToAdd = useAtomValue(searchTextAsCustomContactAtom)
  const toDisplay = useAtomValue(
    filter === 'new'
      ? newContactsToDisplayAtomsAtom
      : filter === 'submitted'
        ? submittedContactsToDisplayAtomsAtom
        : filter === 'nonSubmitted'
          ? nonSubmittedContactsToDisplayAtomsAtom
          : allContactsToDisplayAtomsAtom
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
