import {type ContactHash} from '@vexl-next/domain/src/general/ContactHash.brand'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {Array, HashMap, HashSet, Option, pipe} from 'effect'
import {
  type NormalizedContactValue,
  type StoredContact,
  type StoredContactWithComputedValues,
} from '../domain'

export const CONTACT_IMPORT_BATCH_SIZE = 1000
export const CONTACT_IMPORT_LOCAL_PROCESSING_CHUNK_SIZE = 500
export const CONTACT_NORMALIZATION_CHUNK_SIZE = 50
// UX threshold, intentionally independent of the processing chunk size above —
// tuning chunk sizes for performance must not change when the dialog appears.
export const CONTACT_IMPORT_PROGRESS_DIALOG_MIN_CONTACTS = 500

export function percentageFromProgress({
  processed,
  total,
}: {
  readonly processed: number
  readonly total: number
}): number {
  return total === 0 ? 100 : Math.round((processed / total) * 100)
}

export function determineContactsImportUpdatePlan({
  contactsThatShouldBeImported,
  someContactsShouldBeRemovedFromImport,
  forceFullReplace,
}: {
  readonly contactsThatShouldBeImported: readonly StoredContactWithComputedValues[]
  readonly someContactsShouldBeRemovedFromImport: boolean
  readonly forceFullReplace: boolean
}): {
  readonly doIncrementalUpdate: boolean
  readonly newContactsToImport: readonly StoredContactWithComputedValues[]
} {
  const doIncrementalUpdate =
    !forceFullReplace && !someContactsShouldBeRemovedFromImport

  const newContactsToImport = doIncrementalUpdate
    ? pipe(
        contactsThatShouldBeImported,
        Array.filter((contact) => !contact.flags.imported)
      )
    : contactsThatShouldBeImported

  return {
    doIncrementalUpdate,
    newContactsToImport,
  }
}

export function updateStoredContactImportState({
  contact,
  doIncrementalUpdate,
  hashesToServerClientHash,
  importedValues,
}: {
  readonly contact: StoredContact
  readonly doIncrementalUpdate: boolean
  readonly hashesToServerClientHash: HashMap.HashMap<
    ContactHash,
    ServerToClientHashedNumber
  >
  readonly importedValues: HashSet.HashSet<NormalizedContactValue>
}): StoredContact {
  if (Option.isNone(contact.computedValues)) {
    return {
      ...contact,
      flags: {...contact.flags, imported: false},
    }
  }

  const computedValues = contact.computedValues.value

  if (HashSet.has(importedValues, computedValues.normalizedValue)) {
    return {
      ...contact,
      serverHashToClient: HashMap.get(
        hashesToServerClientHash,
        computedValues.hash
      ),
      flags: {...contact.flags, imported: true},
    }
  }

  return {
    ...contact,
    flags: {
      ...contact.flags,
      imported: doIncrementalUpdate ? contact.flags.imported : false,
    },
  }
}
