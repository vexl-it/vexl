import {atom} from 'jotai'
import {combinedContactsAfterLastSubmitAtom} from '../index'
import {contactsFromDeviceAtom} from './contactsFromDeviceAtom'

const newlyAddedContactsToPhoneContactListAtom = atom((get) => {
  const contactsAfterLastSubmitAtom = get(combinedContactsAfterLastSubmitAtom)
  const contactsFromDevice = get(contactsFromDeviceAtom)

  return contactsFromDevice.filter(
    (oneFromDevice) =>
      !contactsAfterLastSubmitAtom.some(
        (oneLastSeen) =>
          oneLastSeen.normalizedNumber === oneFromDevice.normalizedNumber
      )
  )
})

export default newlyAddedContactsToPhoneContactListAtom
