import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import notEmpty from '../../../utils/notEmpty'
import {StoredContact, type StoredContactWithComputedValues} from '../domain'

export const contactsStoreAtom = atomWithParsedMmkvStorage(
  'storedContacts',
  {contacts: []},
  z.object({
    contacts: z.array(StoredContact),
    lastImport: IsoDatetimeString.optional(),
  })
)

export const storedContactsAtom = focusAtom(contactsStoreAtom, (o) =>
  o.prop('contacts')
)

export const importedContactsAtom = atom((get) =>
  get(storedContactsAtom).filter(
    (contact): contact is StoredContactWithComputedValues =>
      contact.flags.imported && !!contact.computedValues
  )
)

export const newContactsAtom = atom((get) =>
  get(storedContactsAtom).filter((contact) => !contact.flags.seen)
)

export const resolveAllContactsAsSeenActionAtom = atom(null, (get, set) => {
  set(storedContactsAtom, (contacts) =>
    contacts.map((contact) =>
      contact.flags.seen
        ? contact
        : {
            ...contact,
            flags: {...contact.flags, seen: true},
          }
    )
  )
})

export const areThereNewContactsAtom = atom((get) => {
  return get(storedContactsAtom).some((contact) => !contact.flags.seen)
})

export const normalizedContactsAtom = atom(
  (get): StoredContactWithComputedValues[] =>
    get(storedContactsAtom).filter(
      (contact): contact is StoredContactWithComputedValues =>
        !!contact.computedValues
    )
)

export const importedContactsHashesAtom = atom((get) =>
  get(importedContactsAtom)
    .map((contact) => contact.computedValues?.hash)
    .filter(notEmpty)
)

export const lastImportOfContactsAtom = focusAtom(contactsStoreAtom, (o) =>
  o.prop('lastImport')
)

export const importedContactsCountAtom = atom(
  (get) => get(storedContactsAtom).filter((one) => one.flags.imported).length
)
