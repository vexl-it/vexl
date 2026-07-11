import {type MigrationControlReadResult} from '../controlStore/domain'
import {
  resolveRequiredRecoveryTransition,
  type RequiredRecoveryTransition,
} from './recovery'

const cases: ReadonlyArray<
  [MigrationControlReadResult['mode'], RequiredRecoveryTransition]
> = [
  ['normal', 'none'],
  ['recoveryRequired', 'manualRecovery'],
  ['sourceQuiescing', 'sourceCancellableRecovery'],
  ['sourceServing', 'sourceCancellableRecovery'],
  ['sourceSnapshotSent', 'sourceCancellableRecovery'],
  ['sourceAwaitingEraseCommand', 'sourceCancellableRecovery'],
  ['sourceRetirementCommitted', 'sourceResumeRetirement'],
  ['sourceErasing', 'sourceResumeRetirement'],
  ['sourceErasedAwaitingDestinationAck', 'sourceOfferErasedReceipt'],
  ['sourceComplete', 'sourceFinalizeCompletion'],
  ['destinationReceiving', 'destinationResumeReceiving'],
  ['destinationStaged', 'destinationKeepStagedDormant'],
  ['destinationEraseCommandAvailable', 'destinationKeepStagedDormant'],
  ['destinationAwaitingSourceOutcome', 'destinationKeepStagedDormant'],
  ['destinationSourceEraseConfirmed', 'destinationResumeInstall'],
  ['destinationInstalling', 'destinationResumeInstall'],
  ['destinationActivating', 'destinationResumeActivation'],
  ['destinationComplete', 'destinationFinalizeCompletion'],
]

describe('migration recovery decision matrix', () => {
  for (const [mode, expected] of cases) {
    it(`${mode} -> ${expected}`, () => {
      const record = {mode}
      expect(resolveRequiredRecoveryTransition(record)).toBe(expected)
    })
  }
})
