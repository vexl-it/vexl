import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {atom, type Atom} from 'jotai'
import {deduplicateBy} from '../../../utils/deduplicate'
import {type StoredContactWithComputedValues} from '../domain'
import {importedContactsAtom} from './contactsStore'

export default function createImportedContactsForHashesAtom(
  hashes: readonly HashedPhoneNumber[]
): Atom<StoredContactWithComputedValues[]> {
  return atom((get) => {
    const contacts = get(importedContactsAtom)

    return deduplicateBy(
      contacts.filter((contact) =>
        hashes.includes(contact.computedValues.hash)
      ),
      (o) => `${o.computedValues.hash}`
    )
  })
}
