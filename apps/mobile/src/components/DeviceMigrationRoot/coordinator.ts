import {DeviceMigrationErrorCode} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect, Schema} from 'effect'
import {
  acceptEraseCommand,
  awaitSourceOutcome,
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

export type MigrationUiPhase =
  | 'idle'
  | 'destinationEntry'
  | 'sourceStarting'
  | 'sourcePairing'
  | 'sourceAuthCode'
  | 'sourceTransfer'
  | 'sourceAwaitingErase'
  | 'sourceRetiring'
  | 'sourceCancellationQr'
  | 'destinationConnecting'
  | 'destinationAuthCode'
  | 'destinationReceiving'
  | 'destinationStagedWarning'
  | 'destinationEraseQr'
  | 'destinationAwaitingOutcome'
  | 'destinationReceiptScanner'
  | 'destinationInstalling'

export interface MigrationUiState {
  readonly phase: MigrationUiPhase
  readonly qrString?: string
  readonly qrExpiresAt?: number
  readonly humanAuthCode?: string
  readonly errorCode?: typeof DeviceMigrationErrorCode.Type
  readonly cancellationQrString?: string
}

let state: MigrationUiState = {phase: 'idle'}
const listeners = new Set<() => void>()
let sourceSession: ActiveSourceSession | undefined
let destinationSession: ActiveDestinationSession | undefined
let resolveConfirmation: ((confirmed: boolean) => void) | undefined

function publish(next: MigrationUiState): void {
  state = next
  for (const listener of listeners) listener()
}

function errorCodeFromUnknown(
  value: unknown
): typeof DeviceMigrationErrorCode.Type {
  const errorWithCode = Schema.Struct({code: DeviceMigrationErrorCode})
  if (Schema.is(errorWithCode)(value)) return value.code
  return 'stateInvalid'
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
  publish({phase: 'sourceStarting'})
  void Effect.runPromise(
    startSourceSession({
      confirmCode: confirmationEffect(),
      onPairingReady: (pairing) => {
        publish({
          phase: 'sourcePairing',
          qrString: pairing.qrString,
          qrExpiresAt: pairing.qrCode.expiresAt,
        })
      },
      onHumanAuthCode: (humanAuthCode) => {
        publish({phase: 'sourceAuthCode', humanAuthCode})
      },
    })
  )
    .then(async (session) => {
      sourceSession = session
      publish({phase: 'sourceTransfer'})
      await Effect.runPromise(sendSourceSnapshotAndAwaitStaging(session))
      publish({phase: 'sourceAwaitingErase'})
    })
    .catch((error: unknown) => {
      const code = errorCodeFromUnknown(error)
      if (code === 'cancelled') {
        cancelSourceMigrationUi()
        return
      }
      publish({...state, errorCode: code})
    })
}

export function startDestinationMigrationUi(qrString: string): void {
  publish({phase: 'destinationConnecting'})
  void Effect.runPromise(
    startDestinationSession({
      qrString,
      confirmCode: confirmationEffect(),
      onHumanAuthCode: (humanAuthCode) => {
        publish({phase: 'destinationAuthCode', humanAuthCode})
      },
    })
  )
    .then((session) => {
      destinationSession = session
      publish({phase: 'destinationStagedWarning'})
    })
    .catch((error: unknown) => {
      const code = errorCodeFromUnknown(error)
      if (code === 'cancelled') {
        cancelDestinationMigrationUi()
        return
      }
      publish({...state, errorCode: code})
    })
  publish({phase: 'destinationReceiving'})
}

export function confirmMigrationCode(confirmed: boolean): void {
  resolveConfirmation?.(confirmed)
  if (confirmed)
    publish({
      phase:
        state.phase === 'sourceAuthCode'
          ? 'sourceTransfer'
          : 'destinationReceiving',
    })
}

export function cancelSourceMigrationUi(): void {
  resolveConfirmation?.(false)
  void Effect.runPromise(safeCancelSource(sourceSession?.channel))
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
  void Effect.runPromise(safeCancelDestination())
    .then(() => {
      destinationSession = undefined
      publish({phase: 'idle'})
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function acceptEraseCommandUi(qrString: string): void {
  void Effect.runPromise(acceptEraseCommand(qrString, sourceSession?.channel))
    .then(() => {
      publish({phase: 'sourceRetiring'})
      return Effect.runPromise(
        retireSourceAndOfferReceipt(sourceSession?.channel)
      )
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function displayEraseCommandUi(): void {
  void Effect.runPromise(prepareEraseCommand())
    .then((command) => {
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
  publish({phase: 'destinationAwaitingOutcome'})
  void Effect.runPromise(
    awaitSourceOutcome({channel: destinationSession?.channel})
  )
    .then((outcome) => {
      if (outcome === 'cancelled') publish({phase: 'idle'})
      else installDestinationUi()
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
  void Effect.runPromise(awaitSourceOutcome({scannedQrString: qrString}))
    .then((outcome) => {
      if (outcome === 'cancelled') publish({phase: 'idle'})
      else installDestinationUi()
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function installDestinationUi(): void {
  publish({phase: 'destinationInstalling'})
  void Effect.runPromise(
    runDestinationInstall({channel: destinationSession?.channel})
  ).catch((error: unknown) => {
    publish({...state, errorCode: errorCodeFromUnknown(error)})
  })
}

export function clearMigrationUiError(): void {
  const {errorCode: _errorCode, ...withoutError} = state
  publish(withoutError)
}
