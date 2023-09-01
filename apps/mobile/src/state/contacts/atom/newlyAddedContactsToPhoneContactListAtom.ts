import {atom} from 'jotai'
import {
  combineContactsFromDeviceWithImportedContacts,
  combinedContactsAfterLastSubmitAtom,
  importedContactsAtom,
} from '../index'
import {contactsFromDeviceAtom} from './contactsFromDeviceAtom'

const newlyAddedContactsToPhoneContactListAtom = atom((get) => {
  const importedContacts = get(importedContactsAtom)
  const combinedContactsAfterLastSubmit = get(
    combinedContactsAfterLastSubmitAtom
  )
  const combinedContacts = combineContactsFromDeviceWithImportedContacts({
    contactsFromDevice: get(contactsFromDeviceAtom),
    importedContacts,
  })

  return combinedContacts.filter(
    (combinedContact) =>
      !combinedContactsAfterLastSubmit.find(
        (lastSubmitContact) =>
          lastSubmitContact.normalizedNumber ===
          combinedContact.normalizedNumber
      )
  )
})

export default newlyAddedContactsToPhoneContactListAtom
