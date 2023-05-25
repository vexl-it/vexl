import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {z} from 'zod'
import {focusAtom} from 'jotai-optics'
import {ContactNormalizedWithHash} from './domain'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'

export const importedContactsStorageAtom = atomWithParsedMmkvStorage(
  'importedContacts',
  {importedContacts: []},
  z.object({importedContacts: z.array(ContactNormalizedWithHash)})
)
export const importedContactsAtom = focusAtom(
  importedContactsStorageAtom,
  (o) => o.prop('importedContacts')
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
