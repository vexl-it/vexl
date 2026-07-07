import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, pipe} from 'effect'
import {atom, type Atom} from 'jotai'
import {type StoredContactWithComputedValues} from '../domain'
import {importedContactsAtom} from './contactsStore'

export default function createImportedContactsForHashesAtom(
  hashes: readonly HashedPhoneNumber[]
): Atom<StoredContactWithComputedValues[]> {
  const hashesSet = new Set(hashes)

  return atom((get) => {
    // Single pass keeping the first occurrence per hash (same as dedupeWith)
    const includedHashes = new Set<HashedPhoneNumber>()
    return pipe(
      get(importedContactsAtom),
      Array.filter((contact) => {
        const hash = contact.computedValues.hash
        if (!hashesSet.has(hash) || includedHashes.has(hash)) return false
        includedHashes.add(hash)
        return true
      })
    )
  })
}
