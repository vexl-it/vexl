import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import * as T from 'fp-ts/Task'
import {difference} from 'fp-ts/lib/Array'
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
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {deduplicateBy} from '../../../utils/deduplicate'
import reportError from '../../../utils/reportError'
import {contactsMigratedAtom} from '../atoms'
import {type MigrationProgress} from '../types'

const ContactNormalized = z.object({
  name: z.string(),
  label: z.string().optional(),
  numberToDisplay: z.string(),
  normalizedNumber: E164PhoneNumber,
  imageUri: UriString.optional(),
  fromContactList: z.boolean(),
  hash: z.string(),
})
type ContactNormalized = z.TypeOf<typeof ContactNormalized>

const oldImportedContactsStorageAtom = atomWithParsedMmkvStorage(
  'importedContacts',
  {
    importedContacts: [],
    lastImport: undefined,
  },
  z.object({
    importedContacts: z.array(ContactNormalized),
    lastImport: IsoDatetimeString.optional(),
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
      imageUri: oldContact.imageUri,
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

  const importedContactsNumberAfterMigration = store
    .get(importedContactsAtom)
    .map((c) => c.computedValues.normalizedNumber)

  return new Set(
    difference({equals: (a: E164PhoneNumber, b: E164PhoneNumber) => a === b})(
      importedContactsNumberBeforeMigration,
      importedContactsNumberAfterMigration
    )
  )
}

export default async function migrateContacts(
  onProgress: (p: MigrationProgress) => void
): Promise<void> {
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

  await pipe(
    store.set(loadContactsFromDeviceActionAtom),
    T.chain(() =>
      store.set(normalizeStoredContactsActionAtom, {
        onProgress: ({percentDone}) => {
          onProgress({percent: percentDone})
        },
      })
    ),
    T.map(() => {
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

      store.set(storedContactsAtom, (contacts) =>
        deduplicateBy(
          [
            ...contacts.map((oneContact) => {
              if (
                oneContact.computedValues &&
                oldImportedContactsMap.has(
                  oneContact.computedValues.normalizedNumber
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
            ...manuallyImportedContacts.map(oldToNewContactManuallyImported),
          ],
          (contact) => contact.computedValues?.hash ?? contact.info.rawNumber
        )
      )
    })
  )()

  // Check numbers
  const numbersThatWereNotMigrated = findNumbersThatWereNotMigrated()

  if (numbersThatWereNotMigrated.size > 0) {
    console.warn(
      `Problem while migrating contacts. Total missing contacts: ${numbersThatWereNotMigrated.size}. Trying to recover.`
    )

    const missingNumbers = oldImportedContacts.importedContacts
      .filter((one) => numbersThatWereNotMigrated.has(one.normalizedNumber))
      .map(oldToNewContactManuallyImported)

    store.set(storedContactsAtom, (contacts) =>
      deduplicateBy(
        [...contacts, ...missingNumbers],
        (contact) => contact.computedValues?.hash ?? contact.info.rawNumber
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
}
