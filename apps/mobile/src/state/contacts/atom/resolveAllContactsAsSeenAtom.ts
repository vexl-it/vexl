import {atom} from 'jotai'
import {
  combineContactsFromDeviceWithImportedContacts,
  contactsAfterLastSubmitAtom,
  importedContactsAtom,
} from '../index'
import {contactsFromDeviceAtom} from './contactsFromDeviceAtom'

const resolveAllContactsAsSeenAtom = atom(null, (get, set) => {
  const importedContacts = get(importedContactsAtom)
  set(
    contactsAfterLastSubmitAtom,
    combineContactsFromDeviceWithImportedContacts({
      contactsFromDevice: get(contactsFromDeviceAtom),
      importedContacts,
    })
  )
})

export default resolveAllContactsAsSeenAtom
