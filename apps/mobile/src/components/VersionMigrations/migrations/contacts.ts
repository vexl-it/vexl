import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/lib/function'
import {getDefaultStore} from 'jotai'
import {Alert} from 'react-native'
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
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
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

const importedContactsStorageAtom = atomWithParsedMmkvStorage(
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

export default async function migrateContacts(
  onProgress: (p: MigrationProgress) => void
): Promise<void> {
  const store = getDefaultStore()
  const oldImportedContacts = store.get(importedContactsStorageAtom)

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
        oldImportedContacts.importedContacts.filter((oldContact) =>
          storedContactsMap.has(oldContact.normalizedNumber)
        )

      store.set(storedContactsAtom, (contacts) => [
        ...contacts.map((oneContact) => {
          if (
            oneContact.computedValues &&
            oldImportedContactsMap.has(
              oneContact.computedValues?.normalizedNumber
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
      ])
    })
  )()

  // Check numbers
  const importedContactsNumberBeforeMigration =
    oldImportedContacts.importedContacts.length
  const importedContactsNumberAfterMigration =
    store.get(importedContactsAtom).length
  if (
    importedContactsNumberBeforeMigration !==
    importedContactsNumberAfterMigration
  ) {
    Alert.alert(
      store.get(translationAtom).t('migration.contacts.problemTitle'),
      store.get(translationAtom).t('migration.contacts.problemText')
    )
    reportError('warn', new Error('Problem while migrating contacts'), {
      importedContactsNumberAfterMigration,
      importedContactsNumberBeforeMigration,
    })
  } else {
    store.set(importedContactsStorageAtom, {
      importedContacts: [],
      lastImport: undefined,
    })
  }
}
