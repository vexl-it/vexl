import {
  CommandNonce,
  EraseCommandDigest,
  ManifestDigest,
  Sha256Hex,
  SnapshotContentDigest,
  StagingReceiptDigest,
  TransferId,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {
  MigrationEndpointCandidate,
  SourceErasedReceiptQrCode,
} from '@vexl-next/domain/src/general/deviceMigration/qrCodes'
import {VersionTriple} from '@vexl-next/domain/src/general/deviceMigration/version'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

/**
 * Durable device-migration control record (spec sections "State machines and
 * recovery", "Source local retirement" and "Control store" in
 * docs/device-migration-spec.md).
 *
 * The record lives in a dedicated, non-default MMKV instance so it is
 * synchronously readable before Jotai, the session loader or any headless
 * handler runs. It is never included in a snapshot and deliberately survives
 * source account-data cleanup and destination installation until completion
 * is acknowledged.
 *
 * NON-SECRET data only. Directional QR-authentication keys and the staging
 * key live in migration-specific SecureStore entries (see ./secrets.ts).
 * Everything stored here is still sensitive migration METADATA (digests,
 * transfer id, local endpoints) and must never be logged, reported or sent
 * to Vexl.
 */

// ---------------------------------------------------------------------------
// Source cleanup checklist
// ---------------------------------------------------------------------------

/**
 * Idempotent-progress checklist of source retirement (spec section "Source
 * local retirement", steps 4–10). Every step is awaited, read-back verified
 * and persisted so a crash mid-retirement resumes exactly where it stopped.
 */
export const SourceCleanupProgress = Schema.Struct({
  asyncStorageSessionDeleted: Schema.Boolean,
  secureStoreSessionSecretsDeleted: Schema.Boolean,
  pendingMmkvWritesInvalidated: Schema.Boolean,
  mmkvAccountStateCleared: Schema.Boolean,
  accountFileRootsDeleted: Schema.Boolean,
  scheduledNotificationsCancelled: Schema.Boolean,
  notificationStateCleared: Schema.Boolean,
})
export type SourceCleanupProgress = typeof SourceCleanupProgress.Type

export const emptySourceCleanupProgress: SourceCleanupProgress = {
  asyncStorageSessionDeleted: false,
  secureStoreSessionSecretsDeleted: false,
  pendingMmkvWritesInvalidated: false,
  mmkvAccountStateCleared: false,
  accountFileRootsDeleted: false,
  scheduledNotificationsCancelled: false,
  notificationStateCleared: false,
}

export const completeSourceCleanupProgress: SourceCleanupProgress = {
  asyncStorageSessionDeleted: true,
  secureStoreSessionSecretsDeleted: true,
  pendingMmkvWritesInvalidated: true,
  mmkvAccountStateCleared: true,
  accountFileRootsDeleted: true,
  scheduledNotificationsCancelled: true,
  notificationStateCleared: true,
}

export const isSourceCleanupComplete = (
  progress: SourceCleanupProgress
): boolean =>
  progress.asyncStorageSessionDeleted &&
  progress.secureStoreSessionSecretsDeleted &&
  progress.pendingMmkvWritesInvalidated &&
  progress.mmkvAccountStateCleared &&
  progress.accountFileRootsDeleted &&
  progress.scheduledNotificationsCancelled &&
  progress.notificationStateCleared

// ---------------------------------------------------------------------------
// Erase-command bookkeeping (destination side)
// ---------------------------------------------------------------------------

/**
 * One erase-command QR the destination has issued. The destination keeps
 * every issued command (a new nonce may be generated while the same staged
 * package remains intact) so it can validate the source-erased receipt's
 * accepted command digest/nonce and refuse nonce reuse.
 */
export const IssuedEraseCommand = Schema.Struct({
  eraseCommandDigest: EraseCommandDigest,
  commandNonce: CommandNonce,
  issuedAt: UnixMilliseconds,
  expiresAt: UnixMilliseconds,
})
export type IssuedEraseCommand = typeof IssuedEraseCommand.Type

// ---------------------------------------------------------------------------
// Control records — one tagged struct per mode, each carrying exactly the
// data its state requires for crash recovery.
// ---------------------------------------------------------------------------

export const NormalControlRecord = Schema.Struct({
  mode: Schema.Literal('normal'),
})
export type NormalControlRecord = typeof NormalControlRecord.Type

export const NORMAL_MIGRATION_CONTROL_RECORD: NormalControlRecord = {
  mode: 'normal',
}

/** Source blocks new work and drains active work. Safe to cancel. */
export const SourceQuiescingControlRecord = Schema.Struct({
  mode: Schema.Literal('sourceQuiescing'),
  enteredAt: UnixMilliseconds,
})
export type SourceQuiescingControlRecord =
  typeof SourceQuiescingControlRecord.Type

/**
 * Pairing QR/listener active, account persistence read-only. The pairing
 * transcript digest appears once the handshake completes. Safe to cancel.
 */
export const SourceServingControlRecord = Schema.Struct({
  mode: Schema.Literal('sourceServing'),
  enteredAt: UnixMilliseconds,
  transferId: TransferId,
  pairingTranscriptDigest: Schema.optional(Sha256Hex),
})
export type SourceServingControlRecord = typeof SourceServingControlRecord.Type

const sourceSnapshotFields = {
  enteredAt: UnixMilliseconds,
  transferId: TransferId,
  pairingTranscriptDigest: Sha256Hex,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
}

/** Snapshot fully sent; destination is validating/staging. Safe to cancel. */
export const SourceSnapshotSentControlRecord = Schema.Struct({
  mode: Schema.Literal('sourceSnapshotSent'),
  ...sourceSnapshotFields,
})
export type SourceSnapshotSentControlRecord =
  typeof SourceSnapshotSentControlRecord.Type

/**
 * Destination confirmed durable staging (`DestinationStaged`) and may display
 * the erase-command QR. Still safe to cancel — safe cancellation emits an
 * authenticated source cancellation confirmation. The staging receipt digest
 * from `DestinationStaged` is required to validate the erase-command QR.
 */
export const SourceAwaitingEraseCommandControlRecord = Schema.Struct({
  mode: Schema.Literal('sourceAwaitingEraseCommand'),
  ...sourceSnapshotFields,
  stagingReceiptDigest: StagingReceiptDigest,
})
export type SourceAwaitingEraseCommandControlRecord =
  typeof SourceAwaitingEraseCommandControlRecord.Type

const sourceCommittedFields = {
  ...sourceSnapshotFields,
  stagingReceiptDigest: StagingReceiptDigest,
  acceptedEraseCommandDigest: EraseCommandDigest,
  acceptedEraseCommandNonce: CommandNonce,
}

/**
 * The source authenticated the erase-command QR and durably recorded the
 * IRREVERSIBLE transition. Persisted synchronously before showing scan
 * success, acknowledging over the local channel or deleting any account
 * data. From here the source can only finish erasure and provide the
 * receipt — cancellation and normal session loading are permanently
 * forbidden (see LEGAL_MIGRATION_CONTROL_TRANSITIONS).
 */
export const SourceRetirementCommittedControlRecord = Schema.Struct({
  mode: Schema.Literal('sourceRetirementCommitted'),
  ...sourceCommittedFields,
})
export type SourceRetirementCommittedControlRecord =
  typeof SourceRetirementCommittedControlRecord.Type

/** Local cleanup retried until every required step read-back verifies. */
export const SourceErasingControlRecord = Schema.Struct({
  mode: Schema.Literal('sourceErasing'),
  ...sourceCommittedFields,
  cleanupProgress: SourceCleanupProgress,
})
export type SourceErasingControlRecord = typeof SourceErasingControlRecord.Type

/**
 * Cleanup complete; only the minimal recovery listener/UI is available.
 * Carries the full authenticated source-erased receipt so it can be offered
 * over LAN or displayed as a recovery QR until the destination acknowledges
 * activation.
 */
export const SourceErasedAwaitingDestinationAckControlRecord = Schema.Struct({
  mode: Schema.Literal('sourceErasedAwaitingDestinationAck'),
  ...sourceCommittedFields,
  cleanupProgress: SourceCleanupProgress,
  sourceErasedReceipt: SourceErasedReceiptQrCode,
})
export type SourceErasedAwaitingDestinationAckControlRecord =
  typeof SourceErasedAwaitingDestinationAckControlRecord.Type

/** Destination acknowledged activation; migration secrets may be deleted. */
export const SourceCompleteControlRecord = Schema.Struct({
  mode: Schema.Literal('sourceComplete'),
  enteredAt: UnixMilliseconds,
  transferId: TransferId,
})
export type SourceCompleteControlRecord =
  typeof SourceCompleteControlRecord.Type

/**
 * Destination paired (or is pairing) and receives the encrypted snapshot.
 * Vexl egress denied. Source endpoints are kept only while strictly required
 * for reconnect and are deleted with the record.
 */
export const DestinationReceivingControlRecord = Schema.Struct({
  mode: Schema.Literal('destinationReceiving'),
  enteredAt: UnixMilliseconds,
  transferId: TransferId,
  sourceVersion: VersionTriple,
  sourceEndpointCandidates: Schema.NonEmptyArray(MigrationEndpointCandidate),
  pairingTranscriptDigest: Schema.optional(Sha256Hex),
})
export type DestinationReceivingControlRecord =
  typeof DestinationReceivingControlRecord.Type

const destinationStagedFields = {
  enteredAt: UnixMilliseconds,
  transferId: TransferId,
  pairingTranscriptDigest: Sha256Hex,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
  stagingReceiptDigest: StagingReceiptDigest,
  sourceEndpointCandidates: Schema.optional(
    Schema.NonEmptyArray(MigrationEndpointCandidate)
  ),
}

/**
 * Complete encrypted staging package is durable and validated (final stream
 * tag, counts, schemas, hashes, recomputed snapshot content digest, limits,
 * versions, session sanity, free disk). Safe to cancel — no erase-command QR
 * has been displayed yet.
 */
export const DestinationStagedControlRecord = Schema.Struct({
  mode: Schema.Literal('destinationStaged'),
  ...destinationStagedFields,
})
export type DestinationStagedControlRecord =
  typeof DestinationStagedControlRecord.Type

/**
 * The authenticated erase-command QR is displayed. The destination cannot
 * know whether the source scanned it, so staging is protected from automatic
 * deletion. Leaving to `normal` requires an authenticated source
 * cancellation confirmation — never a timeout, disconnect, restart or manual
 * confirmation.
 */
export const DestinationEraseCommandAvailableControlRecord = Schema.Struct({
  mode: Schema.Literal('destinationEraseCommandAvailable'),
  ...destinationStagedFields,
  issuedEraseCommands: Schema.NonEmptyArray(IssuedEraseCommand),
})
export type DestinationEraseCommandAvailableControlRecord =
  typeof DestinationEraseCommandAvailableControlRecord.Type

/**
 * The erase command may have been scanned or the local connection is
 * ambiguous. Only an authenticated source-erased receipt or source
 * cancellation confirmation resolves this state. Vexl egress remains denied.
 */
export const DestinationAwaitingSourceOutcomeControlRecord = Schema.Struct({
  mode: Schema.Literal('destinationAwaitingSourceOutcome'),
  ...destinationStagedFields,
  issuedEraseCommands: Schema.NonEmptyArray(IssuedEraseCommand),
})
export type DestinationAwaitingSourceOutcomeControlRecord =
  typeof DestinationAwaitingSourceOutcomeControlRecord.Type

const destinationConfirmedFields = {
  ...destinationStagedFields,
  issuedEraseCommands: Schema.NonEmptyArray(IssuedEraseCommand),
  sourceErasedReceipt: SourceErasedReceiptQrCode,
}

/**
 * The authenticated source-erased receipt is durably stored (whether it
 * arrived over LAN or QR). Installation may begin; Vexl egress remains
 * denied until installation succeeds and activation-only mode starts.
 */
export const DestinationSourceEraseConfirmedControlRecord = Schema.Struct({
  mode: Schema.Literal('destinationSourceEraseConfirmed'),
  ...destinationConfirmedFields,
})
export type DestinationSourceEraseConfirmedControlRecord =
  typeof DestinationSourceEraseConfirmedControlRecord.Type

/** Idempotently installs staged state; migration-only root stays mounted. */
export const DestinationInstallingControlRecord = Schema.Struct({
  mode: Schema.Literal('destinationInstalling'),
  ...destinationConfirmedFields,
})
export type DestinationInstallingControlRecord =
  typeof DestinationInstallingControlRecord.Type

/**
 * Installation verified. Only the narrow typed activation allowlist
 * (ordinary notification metadata + account reconciliation) is available.
 */
export const DestinationActivatingControlRecord = Schema.Struct({
  mode: Schema.Literal('destinationActivating'),
  ...destinationConfirmedFields,
})
export type DestinationActivatingControlRecord =
  typeof DestinationActivatingControlRecord.Type

/** Staging/control secrets are deleted and normal app boot is allowed. */
export const DestinationCompleteControlRecord = Schema.Struct({
  mode: Schema.Literal('destinationComplete'),
  enteredAt: UnixMilliseconds,
  transferId: TransferId,
})
export type DestinationCompleteControlRecord =
  typeof DestinationCompleteControlRecord.Type

// ---------------------------------------------------------------------------
// Union, modes, read result
// ---------------------------------------------------------------------------

export const MigrationControlRecord = Schema.Union(
  NormalControlRecord,
  SourceQuiescingControlRecord,
  SourceServingControlRecord,
  SourceSnapshotSentControlRecord,
  SourceAwaitingEraseCommandControlRecord,
  SourceRetirementCommittedControlRecord,
  SourceErasingControlRecord,
  SourceErasedAwaitingDestinationAckControlRecord,
  SourceCompleteControlRecord,
  DestinationReceivingControlRecord,
  DestinationStagedControlRecord,
  DestinationEraseCommandAvailableControlRecord,
  DestinationAwaitingSourceOutcomeControlRecord,
  DestinationSourceEraseConfirmedControlRecord,
  DestinationInstallingControlRecord,
  DestinationActivatingControlRecord,
  DestinationCompleteControlRecord
)
export type MigrationControlRecord = typeof MigrationControlRecord.Type

export type MigrationControlMode = MigrationControlRecord['mode']

/**
 * Read-time quarantine representation. Produced (never persisted) when the
 * control store contains a raw value that fails schema validation. Corrupt
 * data in a migration-critical state must NOT silently become 'normal':
 * booting normally could load a session on a source that already committed
 * retirement, or activate a destination without the source-erased receipt.
 * The boot gate keeps the device on the migration root with all Vexl egress
 * denied until the record is repaired or explicitly resolved.
 */
export interface QuarantinedMigrationControlRecord {
  readonly mode: 'recoveryRequired'
}

export type MigrationControlReadResult =
  | MigrationControlRecord
  | QuarantinedMigrationControlRecord

/** Every read result that must boot into the migration-only root. */
export type NonNormalMigrationControlReadResult = Exclude<
  MigrationControlReadResult,
  {mode: 'normal'}
>

/**
 * True when the stored control record exists but cannot be validated. The
 * device stays on the migration root and requires manual/assisted recovery —
 * it must never silently boot normally.
 */
export const needsManualRecovery = (
  readResult: MigrationControlReadResult
): boolean => readResult.mode === 'recoveryRequired'

// ---------------------------------------------------------------------------
// Legal transitions
// ---------------------------------------------------------------------------

/**
 * The legal mode-transition graph (spec section "State machines and
 * recovery"). Every state may self-transition to update its own data
 * (handshake transcript, cleanup checklist, regenerated erase-command
 * nonces, ...).
 *
 * Invariants expressed here:
 * - `sourceRetirementCommitted` (and every later source state) can NEVER
 *   reach `normal`, `sourceQuiescing` or `sourceServing` again — after the
 *   erase command is accepted only erasure and receipt recovery remain.
 * - `destinationSourceEraseConfirmed` and later destination states can never
 *   return to `normal` except through `destinationComplete`.
 * - `destinationEraseCommandAvailable`/`destinationAwaitingSourceOutcome`
 *   list `normal` ONLY for the authenticated source-cancellation
 *   confirmation path; callers must have validated that proof before
 *   transitioning (the graph cannot check authentication).
 */
export const LEGAL_MIGRATION_CONTROL_TRANSITIONS: Record<
  MigrationControlMode,
  readonly MigrationControlMode[]
> = {
  normal: ['normal', 'sourceQuiescing', 'destinationReceiving'],
  sourceQuiescing: ['sourceQuiescing', 'sourceServing', 'normal'],
  sourceServing: ['sourceServing', 'sourceSnapshotSent', 'normal'],
  sourceSnapshotSent: [
    'sourceSnapshotSent',
    'sourceAwaitingEraseCommand',
    'normal',
  ],
  sourceAwaitingEraseCommand: [
    'sourceAwaitingEraseCommand',
    'sourceRetirementCommitted',
    'normal',
  ],
  sourceRetirementCommitted: ['sourceRetirementCommitted', 'sourceErasing'],
  sourceErasing: ['sourceErasing', 'sourceErasedAwaitingDestinationAck'],
  sourceErasedAwaitingDestinationAck: [
    'sourceErasedAwaitingDestinationAck',
    'sourceComplete',
  ],
  sourceComplete: ['sourceComplete', 'normal'],
  destinationReceiving: ['destinationReceiving', 'destinationStaged', 'normal'],
  destinationStaged: [
    'destinationStaged',
    'destinationEraseCommandAvailable',
    'normal',
  ],
  destinationEraseCommandAvailable: [
    'destinationEraseCommandAvailable',
    'destinationAwaitingSourceOutcome',
    'destinationSourceEraseConfirmed',
    'normal',
  ],
  destinationAwaitingSourceOutcome: [
    'destinationAwaitingSourceOutcome',
    'destinationSourceEraseConfirmed',
    'normal',
  ],
  destinationSourceEraseConfirmed: [
    'destinationSourceEraseConfirmed',
    'destinationInstalling',
  ],
  destinationInstalling: ['destinationInstalling', 'destinationActivating'],
  destinationActivating: ['destinationActivating', 'destinationComplete'],
  destinationComplete: ['destinationComplete', 'normal'],
}

export const isLegalMigrationControlTransition = (
  from: MigrationControlMode,
  to: MigrationControlMode
): boolean => LEGAL_MIGRATION_CONTROL_TRANSITIONS[from].includes(to)
