import {Schema} from 'effect/index'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'

const migrationAtomStorage = atomWithParsedMmkvStorage(
  'migration',
  {
    contactsMigrated: false,
  },
  Schema.Struct({
    contactsMigrated: Schema.Boolean,
  })
)

export const contactsMigratedAtom = focusAtom(migrationAtomStorage, (o) =>
  o.prop('contactsMigrated')
)

export const needToRunMigrationAtom = atom((get): boolean => {
  const migrationRecords = get(migrationAtomStorage)
  return !migrationRecords.contactsMigrated
})
