import {
  DeviceMigrationErrorCode,
  type DeviceMigrationError,
} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect, Either, Schema} from 'effect'
import {
  acceptEraseCommand,
  awaitSourceOutcome,
  continueSourceRecovery,
  prepareEraseCommand,
  retireSourceAndOfferReceipt,
  runDestinationInstall,
  safeCancelDestination,
  safeCancelSource,
  sendSourceSnapshotAndAwaitStaging,
  startDestinationSession,
  startSourceSession,
  type ActiveDestinationSession,
  type ActiveSourceSession,
} from '../../utils/deviceMigration/orchestration'
import {type EmulatorMigrationEndpointHost} from './emulatorDeepLink'

export type MigrationUiPhase =
  | 'idle'
  | 'destinationEntry'
  | 'sourceStarting'
  | 'sourcePairing'
  | 'sourceAuthCode'
  | 'sourceAwaitingPeerApproval'
  | 'sourceTransfer'
  | 'sourceAwaitingErase'
  | 'sourceRetiring'
  | 'sourceCancellationQr'
  | 'destinationConnecting'
  | 'destinationAuthCode'
  | 'destinationAwaitingPeerApproval'
  | 'destinationReceiving'
  | 'destinationStagedWarning'
  | 'destinationEraseQr'
  | 'destinationAwaitingOutcome'
  | 'destinationReceiptScanner'
  | 'destinationInstalling'

export type MigrationTraceEvent =
  | 'sourceStarted'
  | 'pairingReady'
  | 'destinationConnecting'
  | 'verificationCodeReady'
  | 'localCodeApproved'
  | 'waitingForPeerApproval'
  | 'bothCodesApproved'
  | 'transferStarted'
  | 'transferVerified'
  | 'eraseCommandReady'
  | 'eraseCommandAccepted'
  | 'sourceErasing'
  | 'sourceErased'
  | 'waitingForSourceOutcome'
  | 'sourceOutcomeVerified'
  | 'installing'
  | 'completed'
  | 'failed'

export interface MigrationTraceEntry {
  readonly id: number
  readonly event: MigrationTraceEvent
}

export interface MigrationUiState {
  readonly phase: MigrationUiPhase
  readonly qrString?: string
  readonly qrExpiresAt?: number
  readonly humanAuthCode?: string
  readonly errorCode?: typeof DeviceMigrationErrorCode.Type
  readonly cancellationQrString?: string
  readonly trace?: readonly MigrationTraceEntry[]
}

const MAX_TRACE_ENTRIES = 12
let traceEntryId = 0
let state: MigrationUiState = {phase: 'idle', trace: []}
const listeners = new Set<() => void>()
let sourceSession: ActiveSourceSession | undefined
let destinationSession: ActiveDestinationSession | undefined
let resolveConfirmation: ((confirmed: boolean) => void) | undefined

function publish(next: MigrationUiState): void {
  state = {...next, trace: next.trace ?? state.trace}
  for (const listener of listeners) listener()
}

function beginTrace(phase: MigrationUiPhase, event: MigrationTraceEvent): void {
  traceEntryId = 1
  publish({phase, trace: [{id: traceEntryId, event}]})
}

function appendTrace(event: MigrationTraceEvent): void {
  traceEntryId += 1
  const entries = [...(state.trace ?? []), {id: traceEntryId, event}]
  publish({...state, trace: entries.slice(-MAX_TRACE_ENTRIES)})
}

function errorCodeFromUnknown(
  value: unknown
): typeof DeviceMigrationErrorCode.Type {
  const errorWithCode = Schema.Struct({code: DeviceMigrationErrorCode})
  if (Schema.is(errorWithCode)(value)) return value.code
  return 'stateInvalid'
}

function runMigrationEffect<A>(
  effect: Effect.Effect<A, DeviceMigrationError>
): Promise<A> {
  return Effect.runPromise(Effect.either(effect)).then(
    Either.match({
      onLeft: (error) => Promise.reject(error),
      onRight: (value) => value,
    })
  )
}

function confirmationEffect(): Effect.Effect<boolean, never> {
  return Effect.async<boolean>((resume) => {
    resolveConfirmation = (confirmed) => {
      resolveConfirmation = undefined
      resume(Effect.succeed(confirmed))
    }
  })
}

export function getMigrationUiState(): MigrationUiState {
  return state
}

export function subscribeToMigrationUiState(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function enterDestinationMigrationUi(): void {
  publish({phase: 'destinationEntry'})
}

export function leaveDestinationMigrationUi(): void {
  publish({phase: 'idle'})
}

export function startSourceMigrationUi(): void {
  beginTrace('sourceStarting', 'sourceStarted')
  void runMigrationEffect(
    startSourceSession({
      confirmCode: confirmationEffect(),
      onPairingReady: (pairing) => {
        appendTrace('pairingReady')
        publish({
          phase: 'sourcePairing',
          qrString: pairing.qrString,
          qrExpiresAt: pairing.qrCode.expiresAt,
        })
      },
      onHumanAuthCode: (humanAuthCode) => {
        appendTrace('verificationCodeReady')
        publish({phase: 'sourceAuthCode', humanAuthCode})
      },
      onBothCodesConfirmed: () => {
        appendTrace('bothCodesApproved')
        appendTrace('transferStarted')
        publish({phase: 'sourceTransfer'})
      },
    })
  )
    .then(async (session) => {
      sourceSession = session
      await runMigrationEffect(sendSourceSnapshotAndAwaitStaging(session))
      appendTrace('transferVerified')
      publish({phase: 'sourceAwaitingErase'})
    })
    .catch((error: unknown) => {
      const code = errorCodeFromUnknown(error)
      if (code === 'cancelled') {
        cancelSourceMigrationUi()
        return
      }
      appendTrace('failed')
      publish({...state, errorCode: code})
    })
}

export function startDestinationMigrationUi(
  qrString: string,
  sourceEndpointHostOverride?: EmulatorMigrationEndpointHost
): void {
  beginTrace('destinationConnecting', 'destinationConnecting')
  void runMigrationEffect(
    startDestinationSession({
      qrString,
      confirmCode: confirmationEffect(),
      onHumanAuthCode: (humanAuthCode) => {
        appendTrace('verificationCodeReady')
        publish({phase: 'destinationAuthCode', humanAuthCode})
      },
      onBothCodesConfirmed: () => {
        appendTrace('bothCodesApproved')
        appendTrace('transferStarted')
        publish({phase: 'destinationReceiving'})
      },
      sourceEndpointHostOverride,
    })
  )
    .then((session) => {
      destinationSession = session
      appendTrace('transferVerified')
      publish({phase: 'destinationStagedWarning'})
    })
    .catch((error: unknown) => {
      const code = errorCodeFromUnknown(error)
      if (code === 'cancelled') {
        cancelDestinationMigrationUi()
        return
      }
      appendTrace('failed')
      publish({...state, errorCode: code})
    })
}

export function confirmMigrationCode(confirmed: boolean): void {
  const authPhase = state.phase
  resolveConfirmation?.(confirmed)
  if (confirmed) {
    appendTrace('localCodeApproved')
    appendTrace('waitingForPeerApproval')
    publish({
      phase:
        authPhase === 'sourceAuthCode'
          ? 'sourceAwaitingPeerApproval'
          : 'destinationAwaitingPeerApproval',
    })
  }
}

export function cancelSourceMigrationUi(): void {
  resolveConfirmation?.(false)
  void runMigrationEffect(safeCancelSource(sourceSession?.channel))
    .then((cancellationQrString) => {
      sourceSession = undefined
      publish(
        cancellationQrString === undefined
          ? {phase: 'idle'}
          : {phase: 'sourceCancellationQr', cancellationQrString}
      )
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function cancelDestinationMigrationUi(): void {
  resolveConfirmation?.(false)
  void runMigrationEffect(safeCancelDestination())
    .then(() => {
      destinationSession = undefined
      publish({phase: 'idle'})
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function acceptEraseCommandUi(qrString: string): void {
  void runMigrationEffect(acceptEraseCommand(qrString, sourceSession?.channel))
    .then(() => {
      appendTrace('eraseCommandAccepted')
      appendTrace('sourceErasing')
      publish({phase: 'sourceRetiring'})
      return runMigrationEffect(
        retireSourceAndOfferReceipt(sourceSession?.channel)
      )
    })
    .then(() => {
      sourceSession = undefined
      appendTrace('sourceErased')
      publish({phase: 'idle'})
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function displayEraseCommandUi(): void {
  void runMigrationEffect(prepareEraseCommand())
    .then((command) => {
      appendTrace('eraseCommandReady')
      publish({phase: 'destinationEraseQr', qrString: command.qrString})
    })
    .catch((error: unknown) => {
      publish({
        phase: 'destinationReceiptScanner',
        errorCode: errorCodeFromUnknown(error),
      })
    })
}

export function awaitSourceOutcomeUi(): void {
  appendTrace('waitingForSourceOutcome')
  publish({phase: 'destinationAwaitingOutcome'})
  void runMigrationEffect(
    awaitSourceOutcome({channel: destinationSession?.channel})
  )
    .then((outcome) => {
      if (outcome === 'cancelled') publish({phase: 'idle'})
      else {
        appendTrace('sourceOutcomeVerified')
        installDestinationUi()
      }
    })
    .catch((error: unknown) => {
      publish({
        phase: 'destinationReceiptScanner',
        errorCode: errorCodeFromUnknown(error),
      })
    })
}

export function regenerateEraseCommandUi(): void {
  displayEraseCommandUi()
}

export function openReceiptScannerUi(): void {
  publish({phase: 'destinationReceiptScanner'})
}

export function acceptReceiptUi(qrString: string): void {
  void runMigrationEffect(awaitSourceOutcome({scannedQrString: qrString}))
    .then((outcome) => {
      if (outcome === 'cancelled') publish({phase: 'idle'})
      else {
        appendTrace('sourceOutcomeVerified')
        installDestinationUi()
      }
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function installDestinationUi(): void {
  appendTrace('installing')
  publish({phase: 'destinationInstalling'})
  void runMigrationEffect(
    runDestinationInstall({channel: destinationSession?.channel})
  )
    .then(() => {
      destinationSession = undefined
      appendTrace('completed')
      publish({phase: 'idle'})
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function finishSourceMigrationUi(): void {
  appendTrace('completed')
  void runMigrationEffect(continueSourceRecovery())
    .then(() => {
      publish({phase: 'idle', trace: []})
    })
    .catch((error: unknown) => {
      appendTrace('failed')
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function clearMigrationUiError(): void {
  const {errorCode: _errorCode, ...withoutError} = state
  publish(withoutError)
}
