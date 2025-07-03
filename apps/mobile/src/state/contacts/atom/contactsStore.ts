import {IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array, Option, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {StoredContactE, type StoredContactWithComputedValues} from '../domain'

export const contactsStoreAtom = atomWithParsedMmkvStorageE(
  'storedContacts',
  {contacts: []},
  Schema.Struct({
    contacts: Schema.Array(StoredContactE).pipe(Schema.mutable),
    lastImport: Schema.optional(IsoDatetimeStringE),
  })
)

export const storedContactsAtom = focusAtom(contactsStoreAtom, (o) =>
  o.prop('contacts')
)

export const importedContactsAtom = atom((get) =>
  pipe(
    get(storedContactsAtom),
    Array.filter((contact) => contact.flags.imported),
    Array.filterMap((contact) =>
      contact.computedValues.pipe(
        Option.map((computedValues) => ({...contact, computedValues}))
      )
    )
  )
)

export const resolveAllContactsAsSeenActionAtom = atom(
  (get) => get(storedContactsAtom).some((contact) => !contact.flags.seen),
  (get, set) => {
    const needsUpdate = get(storedContactsAtom).some(
      (contact) => !contact.flags.seen
    )

    if (needsUpdate)
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
  (get): StoredContactWithComputedValues[] => {
    return pipe(
      get(storedContactsAtom),
      Array.filterMap((contact) =>
        contact.computedValues.pipe(
          Option.map((computedValues) => ({...contact, computedValues}))
        )
      ),
      Array.dedupeWith(
        (first, second) =>
          first.computedValues.normalizedNumber ===
          second.computedValues.normalizedNumber
      )
    )
  }
)

export const importedContactsHashesAtom = atom((get) => {
  return pipe(
    get(importedContactsAtom),
    Array.map((contact) => contact.computedValues.hash)
  )
})

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
