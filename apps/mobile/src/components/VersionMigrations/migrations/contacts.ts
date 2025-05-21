import {
  E164PhoneNumber,
  E164PhoneNumberE,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  UriString,
  UriStringE,
} from '@vexl-next/domain/src/utility/UriString.brand'
import {Array, Effect, Option, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {getDefaultStore} from 'jotai'
import {z} from 'zod'
import {
  importedContactsAtom,
  lastImportOfContactsAtom,
  normalizedContactsAtom,
  storedContactsAtom,
} from '../../../state/contacts/atom/contactsStore'
import loadContactsFromDeviceActionAtom from '../../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import normalizeStoredContactsActionAtom from '../../../state/contacts/atom/normalizeStoredContactsActionAtom'
import {type StoredContactWithComputedValues} from '../../../state/contacts/domain'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import reportError from '../../../utils/reportError'
import {contactsMigratedAtom} from '../atoms'
import {type MigrationProgress} from '../types'

const ContactNormalized = z
  .object({
    name: z.string(),
    label: z.string().optional(),
    numberToDisplay: z.string(),
    normalizedNumber: E164PhoneNumber,
    imageUri: UriString.optional(),
    fromContactList: z.boolean(),
    hash: HashedPhoneNumber,
  })
  .readonly()

const ContactNormalizedE = Schema.Struct({
  name: Schema.String,
  label: Schema.optionalWith(Schema.String, {as: 'Option'}),
  numberToDisplay: Schema.String,
  normalizedNumber: E164PhoneNumberE,
  imageUri: Schema.optionalWith(UriStringE, {as: 'Option'}),
  fromContactList: Schema.Boolean,
  hash: HashedPhoneNumberE,
})
type ContactNormalized = typeof ContactNormalizedE.Type

const oldImportedContactsStorageAtom = atomWithParsedMmkvStorageE(
  'importedContacts',
  {
    importedContacts: [],
    lastImport: undefined,
  },
  Schema.Struct({
    importedContacts: Schema.Array(ContactNormalizedE).pipe(Schema.mutable),
    lastImport: Schema.optional(IsoDatetimeStringE),
  })
)

function oldToNewContactManuallyImported(
  oldContact: ContactNormalized
): StoredContactWithComputedValues {
  return {
    info: {
      name: oldContact.name,
      label: oldContact.label,
      numberToDisplay: oldContact.numberToDisplay,
      rawNumber: oldContact.numberToDisplay,
      nonUniqueContactId: Option.none(),
    },
    computedValues: {
      normalizedNumber: oldContact.normalizedNumber,
      hash: oldContact.hash,
    },
    flags: {
      seen: true,
      imported: true,
      importedManually: true,
      invalidNumber: 'valid',
    },
  }
}

function findNumbersThatWereNotMigrated(): Set<E164PhoneNumber> {
  const store = getDefaultStore()
  const importedContactsNumberBeforeMigration = store
    .get(oldImportedContactsStorageAtom)
    .importedContacts.map((c) => c.normalizedNumber)

  const importedContactsNumberAfterMigration = pipe(
    store.get(importedContactsAtom),
    Array.map((c) => c.computedValues.normalizedNumber)
  )

  return new Set(
    Array.differenceWith((a: E164PhoneNumber, b: E164PhoneNumber) => a === b)(
      importedContactsNumberBeforeMigration,
      importedContactsNumberAfterMigration
    )
  )
}

export default function migrateContacts(
  onProgress: (p: MigrationProgress) => void
): Effect.Effect<void> {
  return Effect.gen(function* (_) {
    const store = getDefaultStore()
    const oldImportedContacts = store.get(oldImportedContactsStorageAtom)

    if (oldImportedContacts.importedContacts.length === 0) return

    const oldImportedContactsMap = new Map(
      oldImportedContacts.importedContacts.map((contact) => [
        contact.normalizedNumber,
        contact,
      ])
    )

    onProgress({
      percent: 0,
    })

    store.set(lastImportOfContactsAtom, oldImportedContacts.lastImport)
    store.set(storedContactsAtom, [])

    yield* _(store.set(loadContactsFromDeviceActionAtom))

    yield* _(
      store.set(normalizeStoredContactsActionAtom, {
        onProgress: ({percentDone}) => {
          onProgress({percent: percentDone})
        },
      })
    )

    const storedContacts = store.get(normalizedContactsAtom)
    const storedContactsMap = new Map(
      storedContacts.map((contact) => [
        contact.computedValues.normalizedNumber,
        contact,
      ])
    )
    const manuallyImportedContacts =
      oldImportedContacts.importedContacts.filter(
        (oldContact) => !storedContactsMap.has(oldContact.normalizedNumber)
      )

    store.set(storedContactsAtom, (contacts) => {
      return pipe(
        Array.map(contacts, (oneContact) => {
          if (
            Option.isSome(oneContact.computedValues) &&
            oldImportedContactsMap.has(
              oneContact.computedValues.value.normalizedNumber
            )
          ) {
            return {
              ...oneContact,
              flags: {...oneContact.flags, imported: true, seen: true},
            }
          }

          return {
            ...oneContact,
            flags: {...oneContact.flags, imported: false, seen: true},
          }
        }),
        Array.unionWith(
          pipe(
            Array.map(
              manuallyImportedContacts,
              oldToNewContactManuallyImported
            ),
            Array.map((contact) => ({
              ...contact,
              computedValues: Option.some(contact.computedValues),
            }))
          ),
          (storedContact, manuallyImportedContact) =>
            Option.isSome(storedContact.computedValues) &&
            Option.isSome(manuallyImportedContact.computedValues)
              ? storedContact.computedValues.value.hash ===
                manuallyImportedContact.computedValues.value.hash
              : storedContact.info.rawNumber ===
                manuallyImportedContact.info.rawNumber
        )
      )
    })

    // Check numbers
    const numbersThatWereNotMigrated = findNumbersThatWereNotMigrated()

    if (numbersThatWereNotMigrated.size > 0) {
      console.warn(
        `Problem while migrating contacts. Total missing contacts: ${numbersThatWereNotMigrated.size}. Trying to recover.`
      )

      const missingNumbers = oldImportedContacts.importedContacts
        .filter((one) => numbersThatWereNotMigrated.has(one.normalizedNumber))
        .map(oldToNewContactManuallyImported)
        .map((contact) => ({
          ...contact,
          computedValues: Option.some(contact.computedValues),
        }))

      store.set(storedContactsAtom, (contacts) =>
        pipe(
          [...contacts, ...missingNumbers],
          Array.dedupeWith((first, second) =>
            Option.isSome(first.computedValues) &&
            Option.isSome(second.computedValues)
              ? first.computedValues.value.hash ===
                second.computedValues.value.hash
              : first.info.rawNumber === second.info.rawNumber
          )
        )
      )

      const recovered = findNumbersThatWereNotMigrated().size === 0

      console.log(
        `Problem while migrating contacts. ${
          recovered ? 'Recovered' : 'Not recovered'
        }`
      )

      reportError(
        'warn',
        new Error('Problem while migrating contacts. Trying to recover.'),
        {
          numberOfMissingContacts: numbersThatWereNotMigrated.size,
          recovered,
        }
      )
    } else {
      store.set(oldImportedContactsStorageAtom, {
        importedContacts: [],
        lastImport: undefined,
      })
    }

    store.set(contactsMigratedAtom, true)
  }).pipe(Effect.ignore)
}
