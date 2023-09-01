import {atom} from 'jotai'
import {
  combineContactsFromDeviceWithImportedContacts,
  combinedContactsAfterLastSubmitAtom,
  importedContactsAtom,
} from '../index'
import {contactsFromDeviceAtom} from './contactsFromDeviceAtom'

const resolveAllContactsAsSeenAtom = atom(null, (get, set) => {
  const importedContacts = get(importedContactsAtom)
  set(
    combinedContactsAfterLastSubmitAtom,
    combineContactsFromDeviceWithImportedContacts({
      contactsFromDevice: get(contactsFromDeviceAtom),
      importedContacts,
    })
  )
})

export default resolveAllContactsAsSeenAtom
