import {type DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect} from 'effect'
import {type MigrationControlReadResult} from '../controlStore/domain'
import {
  finalizeDestinationCompletion,
  runDestinationInstall,
} from './destinationMigration'
import {resolveRequiredRecoveryTransition} from './recovery'
import {continueSourceRecovery} from './retirement'

export * from './destinationMigration'
export * from './quiescence'
export * from './recovery'
export * from './retirement'
export * from './sourceMigration'

/**
 * Dispatches only recovery actions that are unambiguous and mandatory.
 * Cancellable and dormant pre-receipt states intentionally remain untouched
 * for the migration UI/user to resolve; staging is never auto-deleted.
 */
export function dispatchRequiredRecovery(
  record: MigrationControlReadResult
): Effect.Effect<void, DeviceMigrationError> {
  const action = resolveRequiredRecoveryTransition(record)
  if (action === 'sourceResumeRetirement')
    return continueSourceRecovery().pipe(Effect.asVoid)
  if (
    action === 'destinationResumeInstall' ||
    action === 'destinationResumeActivation'
  )
    return runDestinationInstall()
  if (action === 'destinationFinalizeCompletion')
    return finalizeDestinationCompletion()
  return Effect.void
}
