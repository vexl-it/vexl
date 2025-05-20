import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, pipe} from 'effect'
import {atom, type Atom} from 'jotai'
import {type StoredContactWithComputedValues} from '../domain'
import {importedContactsAtom} from './contactsStore'

export default function createImportedContactsForHashesAtom(
  hashes: readonly HashedPhoneNumber[]
): Atom<StoredContactWithComputedValues[]> {
  return atom((get) =>
    pipe(
      get(importedContactsAtom),
      Array.filter((contact) => hashes.includes(contact.computedValues.hash)),
      Array.dedupeWith(
        (first, second) =>
          first.computedValues.hash === second.computedValues.hash
      )
    )
  )
}
