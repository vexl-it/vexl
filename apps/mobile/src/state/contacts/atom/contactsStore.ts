import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array, Option, pipe, Schema} from 'effect'
import {atom, type Atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomFamily} from 'jotai/utils'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {
  StoredContact,
  type NormalizedContactValue,
  type StoredContactWithComputedValues,
} from '../domain'

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

export const newContactsToReviewRawValuesAtom = atom((get) =>
  pipe(
    get(storedContactsAtom),
    Array.reduce(new Set<string>(), (rawValues, contact) => {
      if (!contact.flags.seen) rawValues.add(contact.info.rawValue)
      return rawValues
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
    const seenNormalizedValues = new Set<string>()
    return pipe(
      get(storedContactsAtom),
      Array.filterMap((contact) =>
        contact.computedValues.pipe(
          Option.filter((computedValues) => {
            if (seenNormalizedValues.has(computedValues.normalizedValue))
              return false
            seenNormalizedValues.add(computedValues.normalizedValue)
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

export const contactByNormalizedValueAtom = atomFamily(
  (normalizedValue: NormalizedContactValue | undefined) =>
    atom((get) => {
      if (normalizedValue === undefined) return undefined

      return pipe(
        get(normalizedContactsAtom),
        Array.findFirst(
          (contact) =>
            contact.computedValues.normalizedValue === normalizedValue
        ),
        Option.getOrUndefined
      )
    })
)

/**
 * Manually added contacts get a generated id so that the phone and email rows
 * of one person stay paired (edit form, common friends dedup, vCard export).
 */
export function createPairedContactAtom(
  contact: StoredContactWithComputedValues | undefined
): Atom<StoredContactWithComputedValues | undefined> {
  return atom((get) => {
    if (contact === undefined || Option.isNone(contact.info.nonUniqueContactId))
      return undefined

    const contactId = contact.info.nonUniqueContactId.value
    const siblings = pipe(
      get(normalizedContactsAtom),
      Array.filter(
        (one) =>
          one.info.kind !== contact.info.kind &&
          Option.contains(one.info.nonUniqueContactId, contactId)
      )
    )

    // A device contact with several values of the other kind has no single
    // counterpart to edit
    return siblings.length === 1 ? siblings[0] : undefined
  })
}

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
