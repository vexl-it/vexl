import {Schema} from 'effect'

/**
 * Enumerated, non-sensitive device migration error codes.
 *
 * Per spec section "Error reporting and telemetry" migration errors are shown
 * locally only. They must never carry arbitrary causes, request objects,
 * manifests, frame data, paths, keys, digests, or extras — anything beyond
 * one of these codes could leak migration metadata into error reporting.
 */
export const DeviceMigrationErrorCode = Schema.Literal(
  'qrInvalid',
  'qrExpired',
  'versionMismatch',
  'limitExceeded',
  'macInvalid',
  'digestMismatch',
  'schemaInvalid',
  'stateInvalid',
  'roleInvalid',
  'nonceReused',
  'handshakeFailed',
  'transportFailed',
  'timedOut',
  'cancelled',
  'stagingIncomplete',
  'pathInvalid',
  'freshInstallRequired',
  'insufficientDiskSpace',
  'cleanupIncomplete',
  'permissionDenied',
  'unknownStorageKey',
  'sessionInvalid',
  'receiptInvalid'
)
export type DeviceMigrationErrorCode = typeof DeviceMigrationErrorCode.Type

/**
 * The only error type migration code is allowed to surface. It deliberately
 * carries nothing but an enumerated code.
 */
export class DeviceMigrationError extends Schema.TaggedError<DeviceMigrationError>(
  'DeviceMigrationError'
)('DeviceMigrationError', {
  code: DeviceMigrationErrorCode,
}) {}
