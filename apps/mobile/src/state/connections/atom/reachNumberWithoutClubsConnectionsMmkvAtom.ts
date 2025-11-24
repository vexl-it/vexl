import {Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {importedContactsCountAtom} from '../../contacts/atom/contactsStore'
import {fistAndSecondLevelConnectionsReachAtom} from './connectionStateAtom'

const PersistentDataAboutReachAndImportedContacts = Schema.Struct({
  data: Schema.Struct({
    reach: Schema.Int,
    numberOfImportedContacts: Schema.Int,
  }),
})
type PersistentDataAboutReachAndImportedContacts =
  typeof PersistentDataAboutReachAndImportedContacts.Type

const persistentDataAboutReachAndImportedContactsMmkvAtom =
  atomWithParsedMmkvStorageE(
    'persistedDataAboutReachAndImportedContacts',
    {data: {reach: 0, numberOfImportedContacts: 0}},
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

export const updatePersistentDataAboutReachActionAtom = atom(
  null,
  (get, set) => {
    const currentReach = get(fistAndSecondLevelConnectionsReachAtom)

    set(persistentDataAboutReachAtom, currentReach)
  }
)

export const updatePersistentDataAboutNumberOfImportedContactsActionAtom = atom(
  null,
  (get, set) => {
    const importedContactsCount = get(importedContactsCountAtom)

    set(persistentDataAboutNumberOfImportedContactsAtom, importedContactsCount)
  }
)

export const fixReachAndReencryptOffersIfNeededActionAtom = atom(
  null,
  (get, set): void => {
    const currentReach = get(fistAndSecondLevelConnectionsReachAtom)
    const importedContactsCount = get(importedContactsCountAtom)
    if (currentReach > 0) set(persistentDataAboutReachAtom, currentReach)
    if (importedContactsCount > 0)
      set(
        persistentDataAboutNumberOfImportedContactsAtom,
        importedContactsCount
      )
  }
)

export const clearPersistentDataAboutReachAndImportedContactsActionAtom = atom(
  null,
  (get, set): void => {
    set(persistentDataAboutReachAndImportedContactsAtom, {
      reach: 0,
      numberOfImportedContacts: 0,
    })
  }
)
