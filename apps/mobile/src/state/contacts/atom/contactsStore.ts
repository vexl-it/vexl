import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {deduplicateBy} from '../../../utils/deduplicate'
import notEmpty from '../../../utils/notEmpty'
import {StoredContact, type StoredContactWithComputedValues} from '../domain'

export const contactsStoreAtom = atomWithParsedMmkvStorage(
  'storedContacts',
  {contacts: []},
  z
    .object({
      contacts: z.array(StoredContact).readonly(),
      lastImport: IsoDatetimeString.optional(),
    })
    .readonly()
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

export const resolveAllContactsAsSeenActionAtom = atom(
  (get) => get(storedContactsAtom).some((contact) => !contact.flags.seen),
  (get, set) => {
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
  }
)

export const normalizedContactsAtom = atom(
  (get): StoredContactWithComputedValues[] =>
    deduplicateBy(
      get(storedContactsAtom).filter(
        (contact): contact is StoredContactWithComputedValues =>
          !!contact.computedValues
      ),
      (one) => one.computedValues.normalizedNumber
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

export const eraseStoreActionAtom = atom(null, (get, set) => {
  set(contactsStoreAtom, {contacts: [], lastImport: undefined})
})

export const eraseImportedContacts = atom(null, (get, set) => {
  set(contactsStoreAtom, (o) => ({
    contacts: o.contacts.filter((one) => one.flags.importedManually),
    lastImport: undefined,
  }))
})

export const alreadyImpotedContactsAtom = atom(
  (get) => get(importedContactsAtom).length > 0
)
