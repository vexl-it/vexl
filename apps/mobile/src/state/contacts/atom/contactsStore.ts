import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array, Option, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomFamily} from 'jotai/utils'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {StoredContact, type StoredContactWithComputedValues} from '../domain'

export const contactsStoreAtom = atomWithParsedMmkvStorage(
  'storedContacts',
  {contacts: [], needsFullContactsReplaceAfterContactEdit: false},
  Schema.Struct({
    contacts: Schema.Array(StoredContact).pipe(Schema.mutable),
    lastImport: Schema.optional(IsoDatetimeString),
    needsFullContactsReplaceAfterContactEdit: Schema.optionalWith(
      Schema.Boolean,
      {
        default: () => false,
      }
    ),
  })
)

export const storedContactsAtom = focusAtom(contactsStoreAtom, (o) =>
  o.prop('contacts')
)

export const needsFullContactsReplaceAfterContactEditAtom = focusAtom(
  contactsStoreAtom,
  (o) => o.prop('needsFullContactsReplaceAfterContactEdit')
)

export const newPhoneContactsToReviewRawNumbersAtom = atom((get) =>
  pipe(
    get(storedContactsAtom),
    Array.reduce(new Set<string>(), (rawNumbers, contact) => {
      if (!contact.flags.seen) rawNumbers.add(contact.info.rawNumber)
      return rawNumbers
    }),
    Array.fromIterable
  )
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

// A derived contact only changes when its StoredContact object changes. Keep
// the wrapper stable so a one-contact store update does not make every
// splitAtom row observe a new value and rerender.
const normalizedContactByStoredContact = new WeakMap<
  object,
  StoredContactWithComputedValues
>()

export const normalizedContactsAtom = atom(
  (get): StoredContactWithComputedValues[] => {
    // Set-keyed dedupe (keeps the first occurrence, same as dedupeWith)
    // to avoid O(n²) pairwise comparisons on large contact lists.
    const seenNormalizedNumbers = new Set<string>()
    return pipe(
      get(storedContactsAtom),
      Array.filterMap((contact) =>
        contact.computedValues.pipe(
          Option.filter((computedValues) => {
            if (seenNormalizedNumbers.has(computedValues.normalizedNumber))
              return false
            seenNormalizedNumbers.add(computedValues.normalizedNumber)
            return true
          }),
          Option.map((computedValues) => {
            const cachedContact = normalizedContactByStoredContact.get(contact)
            if (cachedContact !== undefined) return cachedContact

            const normalizedContact = {...contact, computedValues}
            normalizedContactByStoredContact.set(contact, normalizedContact)
            return normalizedContact
          })
        )
      )
    )
  }
)

export const contactByNormalizedNumberAtom = atomFamily(
  (contactNumber: E164PhoneNumber | undefined) =>
    atom((get) => {
      if (contactNumber === undefined) return undefined

      return pipe(
        get(normalizedContactsAtom),
        Array.findFirst(
          (contact) => contact.computedValues.normalizedNumber === contactNumber
        ),
        Option.getOrUndefined
      )
    })
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
  set(contactsStoreAtom, {
    contacts: [],
    lastImport: undefined,
    needsFullContactsReplaceAfterContactEdit: false,
  })
})

export const eraseImportedContacts = atom(null, (get, set) => {
  set(contactsStoreAtom, (o) => ({
    contacts: o.contacts.filter((one) => one.flags.importedManually),
    lastImport: undefined,
    needsFullContactsReplaceAfterContactEdit: false,
  }))
})

export const alreadyImpotedContactsAtom = atom(
  (get) => get(importedContactsAtom).length > 0
)
