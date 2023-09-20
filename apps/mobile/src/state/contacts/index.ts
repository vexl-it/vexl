import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {z} from 'zod'
import {focusAtom} from 'jotai-optics'
import {ContactNormalized, ContactNormalizedWithHash} from './domain'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'

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
  {importedContacts: [], lastImport: undefined},
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
