import {type ContactHash} from '@vexl-next/domain/src/general/ContactHash.brand'
import {Array, Option, pipe} from 'effect'
import {atom, type Atom} from 'jotai'
import {type StoredContactWithComputedValues} from '../domain'
import {importedContactsAtom} from './contactsStore'

// One person can match several hashes (their phone number and their email).
// Rows of one device contact share an id; manually added rows without an id
// fall back to the name.
function contactIdentity(contact: StoredContactWithComputedValues): string {
  return pipe(
    contact.info.nonUniqueContactId,
    Option.map((id) => `id:${id}`),
    Option.getOrElse(() => `name:${contact.info.name}`)
  )
}

export default function createImportedContactsForHashesAtom(
  hashes: readonly ContactHash[]
): Atom<StoredContactWithComputedValues[]> {
  const hashesSet = new Set(hashes)

  return atom((get) => {
    // Single pass keeping the first occurrence per person (same as dedupeWith)
    const includedIdentities = new Set<string>()
    return pipe(
      get(importedContactsAtom),
      Array.filter((contact) => {
        if (!hashesSet.has(contact.computedValues.hash)) return false
        const identity = contactIdentity(contact)
        if (includedIdentities.has(identity)) return false
        includedIdentities.add(identity)
        return true
      })
    )
  })
}
