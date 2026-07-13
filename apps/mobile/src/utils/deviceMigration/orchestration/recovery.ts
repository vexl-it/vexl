import {type MigrationControlReadResult} from '../controlStore/domain'

export type RequiredRecoveryTransition =
  | 'none'
  | 'manualRecovery'
  | 'sourceCancellableRecovery'
  | 'sourceResumeRetirement'
  | 'sourceOfferErasedReceipt'
  | 'sourceFinalizeCompletion'
  | 'destinationResumeReceiving'
  | 'destinationKeepStagedDormant'
  | 'destinationResumeInstall'
  | 'destinationResumeActivation'
  | 'destinationFinalizeCompletion'

/** Pure exhaustive boot routing. No destination pre-receipt mode deletes staging. */
export function resolveRequiredRecoveryTransition(record: {
  readonly mode: MigrationControlReadResult['mode']
}): RequiredRecoveryTransition {
  switch (record.mode) {
    case 'normal':
      return 'none'
    case 'recoveryRequired':
      return 'manualRecovery'
    case 'sourceQuiescing':
    case 'sourceServing':
    case 'sourceSnapshotSent':
    case 'sourceAwaitingEraseCommand':
      return 'sourceCancellableRecovery'
    case 'sourceRetirementCommitted':
    case 'sourceErasing':
      return 'sourceResumeRetirement'
    case 'sourceErasedAwaitingDestinationAck':
      return 'sourceOfferErasedReceipt'
    case 'sourceComplete':
      return 'sourceFinalizeCompletion'
    case 'destinationReceiving':
      return 'destinationResumeReceiving'
    case 'destinationStaged':
    case 'destinationEraseCommandAvailable':
    case 'destinationAwaitingSourceOutcome':
      return 'destinationKeepStagedDormant'
    case 'destinationSourceEraseConfirmed':
    case 'destinationInstalling':
      return 'destinationResumeInstall'
    case 'destinationActivating':
      return 'destinationResumeActivation'
    case 'destinationComplete':
      return 'destinationFinalizeCompletion'
  }
}
