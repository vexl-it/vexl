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

export const persistentDataAboutNumberOfImportedContactsAtom = focusAtom(
  persistentDataAboutReachAndImportedContactsAtom,
  (p) => p.prop('numberOfImportedContacts')
)

// Written only after a successful import, so an empty graph fetched later is
// a server failure rather than a fresh user.
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
