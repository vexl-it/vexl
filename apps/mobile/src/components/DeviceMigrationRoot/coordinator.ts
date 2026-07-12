import {
  DeviceMigrationErrorCode,
  type DeviceMigrationError,
} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect, Either, Schema} from 'effect'
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
import {type EmulatorMigrationEndpointHost} from './emulatorDeepLink'

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
  publish({phase: 'sourceStarting'})
  void runMigrationEffect(
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
      await runMigrationEffect(sendSourceSnapshotAndAwaitStaging(session))
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

export function startDestinationMigrationUi(
  qrString: string,
  sourceEndpointHostOverride?: EmulatorMigrationEndpointHost
): void {
  publish({phase: 'destinationConnecting'})
  void runMigrationEffect(
    startDestinationSession({
      qrString,
      confirmCode: confirmationEffect(),
      onHumanAuthCode: (humanAuthCode) => {
        publish({phase: 'destinationAuthCode', humanAuthCode})
      },
      sourceEndpointHostOverride,
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
      publish({phase: 'sourceRetiring'})
      return runMigrationEffect(
        retireSourceAndOfferReceipt(sourceSession?.channel)
      )
    })
    .then(() => {
      sourceSession = undefined
      publish({phase: 'idle'})
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function displayEraseCommandUi(): void {
  void runMigrationEffect(prepareEraseCommand())
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
  void runMigrationEffect(
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
  void runMigrationEffect(awaitSourceOutcome({scannedQrString: qrString}))
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
  void runMigrationEffect(
    runDestinationInstall({channel: destinationSession?.channel})
  )
    .then(() => {
      destinationSession = undefined
      publish({phase: 'idle'})
    })
    .catch((error: unknown) => {
      publish({...state, errorCode: errorCodeFromUnknown(error)})
    })
}

export function clearMigrationUiError(): void {
  const {errorCode: _errorCode, ...withoutError} = state
  publish(withoutError)
}
