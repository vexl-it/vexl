import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {z} from 'zod'
import {focusAtom} from 'jotai-optics'
import {ContactNormalizedWithHash} from './domain'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'

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
