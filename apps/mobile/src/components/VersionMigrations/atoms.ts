import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'

const migrationAtomStorage = atomWithParsedMmkvStorage(
  'migration',
  {
    contactsMigrated: false,
  },
  z.object({
    contactsMigrated: z.boolean().default(false),
  })
)

export const contactsMigratedAtom = focusAtom(migrationAtomStorage, (o) =>
  o.prop('contactsMigrated')
)

export const needToRunMigrationAtom = atom((get): boolean => {
  const migrationRecords = get(migrationAtomStorage)
  return !migrationRecords.contactsMigrated
})
