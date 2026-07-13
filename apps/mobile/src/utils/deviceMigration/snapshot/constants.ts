import {type MigrationKeyPolicy} from '@vexl-next/domain/src/general/deviceMigration/snapshotEntries'

/**
 * Policies whose keys are included in a migration snapshot (spec section
 * "Migration policy registry"). `deviceLocal`, `ephemeral` and `lifecycle`
 * keys are never exported.
 */
export const EXPORTED_MIGRATION_POLICIES: readonly MigrationKeyPolicy[] = [
  'account',
  'preference',
  'rebuild',
]

/**
 * Destination staging directory under the application Documents root. Never
 * enumerated by the file exporter (only the approved roots are) and deleted
 * verified on completion or authenticated safe cancellation.
 */
export const STAGING_DIRECTORY_NAME = 'device-migration-staging'
