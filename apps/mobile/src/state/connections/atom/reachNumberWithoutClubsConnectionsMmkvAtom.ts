import {Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {importedContactsCountAtom} from '../../contacts/atom/contactsStore'

export const PERSISTENT_DATA_ABOUT_REACH_AND_IMPORTED_CONTACTS_STORAGE_KEY =
  'persistedDataAboutReachAndImportedContacts'

const THRESHOLD_REACH_NUMBER = 50

const PersistentDataAboutReachAndImportedContacts = Schema.Struct({
  data: Schema.Struct({
    reach: Schema.Int,
    numberOfImportedContacts: Schema.Int,
  }),
})
type PersistentDataAboutReachAndImportedContacts =
  typeof PersistentDataAboutReachAndImportedContacts.Type

const defaultPersistentDataAboutReachAndImportedContacts: PersistentDataAboutReachAndImportedContacts =
  {data: {reach: 0, numberOfImportedContacts: 0}}

const persistentDataAboutReachAndImportedContactsMmkvAtom =
  atomWithParsedMmkvStorage(
    PERSISTENT_DATA_ABOUT_REACH_AND_IMPORTED_CONTACTS_STORAGE_KEY,
    defaultPersistentDataAboutReachAndImportedContacts,
    PersistentDataAboutReachAndImportedContacts
  )

export const persistentDataAboutReachAndImportedContactsAtom = focusAtom(
  persistentDataAboutReachAndImportedContactsMmkvAtom,
  (p) => p.prop('data')
)

export const persistentDataAboutReachAtom = focusAtom(
  persistentDataAboutReachAndImportedContactsAtom,
  (p) => p.prop('reach')
)

/**
 * Ordinary syncs only raise the stored reach, so a shrinking graph never
 * disarms the reach-drop guard. Only a contacts import lowers it. Saved right
 * away, so a restart never pairs a stored graph with the reach of an older one.
 */
export const raisePersistedReachActionAtom = atom(
  null,
  (get, set, reach: number): void => {
    set(persistentDataAboutReachAtom, (stored) => Math.max(stored, reach))
    persistentDataAboutReachAndImportedContactsMmkvAtom.flushNow()
  }
)

export const persistentDataAboutNumberOfImportedContactsAtom = focusAtom(
  persistentDataAboutReachAndImportedContactsAtom,
  (p) => p.prop('numberOfImportedContacts')
)

// A heuristic: a user who had this much reach and has contacts imported
// normally never gets an empty graph, so an ordinary sync treats one as a
// server failure. It can also be genuine (e.g. a network that only came through
// numbers banned from connecting people), which a confirmed contacts re-import
// accepts.
export const persistedReachRequiresConnectionsAtom = atom((get) => {
  const {reach, numberOfImportedContacts} = get(
    persistentDataAboutReachAndImportedContactsAtom
  )
  return reach > THRESHOLD_REACH_NUMBER && numberOfImportedContacts > 0
})

export const updatePersistentDataAboutNumberOfImportedContactsActionAtom = atom(
  null,
  (get, set) => {
    const importedContactsCount = get(importedContactsCountAtom)

    set(persistentDataAboutNumberOfImportedContactsAtom, importedContactsCount)
  }
)

export const clearPersistentDataAboutReachAndImportedContactsActionAtom = atom(
  null,
  (get, set): void => {
    set(
      persistentDataAboutReachAndImportedContactsMmkvAtom,
      defaultPersistentDataAboutReachAndImportedContacts
    )
  }
)
