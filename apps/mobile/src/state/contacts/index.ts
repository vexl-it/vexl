import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {atom, type Atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {ContactNormalized, ContactNormalizedWithHash} from './domain'

// time in minutes
const TIME_SINCE_CONTACTS_IMPORT_THRESHOLD = 60

export const combinedContactsAfterLastSubmitStorageAtom =
  atomWithParsedMmkvStorage(
    'combinedContactsAfterLastSubmit',
    {combinedContactsAfterLastSubmit: null},
    z.object({
      combinedContactsAfterLastSubmit: z.array(ContactNormalized).nullable(),
    })
  )

export const combinedContactsAfterLastSubmitAtom = focusAtom(
  combinedContactsAfterLastSubmitStorageAtom,
  (o) => o.prop('combinedContactsAfterLastSubmit')
)

export const importedContactsStorageAtom = atomWithParsedMmkvStorage(
  'importedContacts',
  {
    importedContacts: [],
    lastImport: undefined,
  },
  z.object({
    importedContacts: z.array(ContactNormalizedWithHash),
    lastImport: IsoDatetimeString.optional(),
  })
)

export const importedContactsAtom = focusAtom(
  importedContactsStorageAtom,
  (o) => o.prop('importedContacts')
)

export const lastImportOfContactsAtom = focusAtom(
  importedContactsStorageAtom,
  (o) => o.prop('lastImport')
)

export const importedContactsCountAtom = selectAtom(
  importedContactsAtom,
  (contacts) => contacts.length
)

export const importedContactsHashesAtom = selectAtom(
  importedContactsAtom,
  (o) => o.map((one) => one.hash)
)

export const minutesTillOffersDisplayedAtom = atom(
  TIME_SINCE_CONTACTS_IMPORT_THRESHOLD
)

export const initializeMinutesTillOffersDisplayedActionAtom = atom(
  null,
  (get, set) => {
    const lastImportOfContacts = get(lastImportOfContactsAtom)

    const minutesSinceLastImport = Math.abs(
      Math.round(
        DateTime.now().diff(
          DateTime.fromISO(lastImportOfContacts ?? new Date().toISOString()),
          'minutes'
        ).minutes
      )
    )
    const timeLeftTillOffersAreLoaded =
      TIME_SINCE_CONTACTS_IMPORT_THRESHOLD - minutesSinceLastImport

    set(
      minutesTillOffersDisplayedAtom,
      timeLeftTillOffersAreLoaded > 0 && timeLeftTillOffersAreLoaded <= 60
        ? timeLeftTillOffersAreLoaded
        : 0
    )
  }
)

export function selectImportedContactsWithHashes(
  hashes: readonly string[]
): Atom<ContactNormalizedWithHash[]> {
  return selectAtom(importedContactsAtom, (importedContacts) => {
    return importedContacts.filter((one) => hashes.includes(one.hash))
  })
}

export function combineContactsFromDeviceWithImportedContacts({
  contactsFromDevice,
  importedContacts,
}: {
  contactsFromDevice: ContactNormalized[]
  importedContacts: ContactNormalized[]
}): ContactNormalized[] {
  const toReturn = [...contactsFromDevice]

  for (const oneContact of importedContacts) {
    if (!oneContact.fromContactList) {
      // If contact is not from contact list add it. We should display it.
      toReturn.push(oneContact)
      continue
    }

    if (
      !contactsFromDevice.some(
        (oneFromDevice) =>
          oneFromDevice.normalizedNumber === oneContact.normalizedNumber
      )
    ) {
      // Those contacts were imported but are not in contact list anymore
      toReturn.push({
        ...oneContact,
        fromContactList: false,
        imageUri: undefined,
      })
    }
  }

  return toReturn
}
