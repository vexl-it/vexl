import {atom} from 'jotai'
import {
  combineContactsFromDeviceWithImportedContacts,
  contactsAfterLastSubmitAtom,
  importedContactsAtom,
} from '../index'
import {contactsFromDeviceAtom} from './contactsFromDeviceAtom'

const newlyAddedContactsToPhoneContactListAtom = atom((get) => {
  const importedContacts = get(importedContactsAtom)
  const contactsAfterLastSubmit = get(contactsAfterLastSubmitAtom)
  const combinedContacts = combineContactsFromDeviceWithImportedContacts({
    contactsFromDevice: get(contactsFromDeviceAtom),
    importedContacts,
  })

  return combinedContacts.filter(
    (combinedContact) =>
      !contactsAfterLastSubmit.find(
        (lastSubmitContact) =>
          lastSubmitContact.normalizedNumber ===
          combinedContact.normalizedNumber
      )
  )
})

export default newlyAddedContactsToPhoneContactListAtom
