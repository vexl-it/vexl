import {atom, useAtomValue} from 'jotai'
import {contactsFromDeviceAtom} from './contactsFromDevice'
import * as O from 'fp-ts/Option'
import {customContactsAtom} from './customContacts'
import {type ContactNormalized} from '../brands/ContactNormalized.brand'
import {searchTextAtom} from './searchBar'
import {matchSorter} from 'match-sorter'

export const contactsToDisplayAtom = atom((get) => {
  const contactsFromDevice = get(contactsFromDeviceAtom)
  const customContacts = get(customContactsAtom)
  const searchText = get(searchTextAtom)

  const allContacts = [
    ...(O.isSome(contactsFromDevice) ? contactsFromDevice.value : []),
    ...(O.isSome(customContacts) ? customContacts.value : []),
  ]

  const contacts = matchSorter(allContacts, searchText, {
    keys: ['name', 'numberToDisplay'],
  })

  return contacts
})

export function useContactsToDisplay(): ContactNormalized[] {
  return useAtomValue(contactsToDisplayAtom)
}
