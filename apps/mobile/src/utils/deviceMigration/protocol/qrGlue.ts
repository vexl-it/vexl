import {constantTimeEqualStrings} from '@vexl-next/cryptography/src/operations/deviceMigration/constantTimeEqual'
import {
  generateEphemeralKxKeyPair,
  type MigrationKxKeyPair,
} from '@vexl-next/cryptography/src/operations/deviceMigration/keyExchange'
import {
  createQrMac,
  verifyQrMac,
} from '@vexl-next/cryptography/src/operations/deviceMigration/qrAuth'
import {generateRandomBase64Url} from '@vexl-next/cryptography/src/operations/deviceMigration/randomBytes'
import {sha256Bytes} from '@vexl-next/cryptography/src/operations/deviceMigration/sha256'
import {
  type CleanupResultDigest,
  CommandNonce,
  EraseCommandDigest,
  type ManifestDigest,
  MigrationKeyExchangePublicKey,
  PairingCapability,
  QrAuthMac,
  ReceiptNonce,
  type SnapshotContentDigest,
  type StagingReceiptDigest,
  TransferId,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {
  bytesToHex,
  concatBytes,
} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {QR_CODE_EXPIRY_MS} from '@vexl-next/domain/src/general/deviceMigration/limits'
import {
  EraseCommandQrCode,
  eraseCommandQrCodeMacPayloadBytes,
  type MigrationEndpointCandidate,
  PairingQrCode,
  sourceCancellationConfirmedMacPayloadBytes,
  SourceCancellationConfirmedQrCode,
  sourceErasedReceiptMacPayloadBytes,
  SourceErasedReceiptQrCode,
  validateQrCodeNotExpired,
} from '@vexl-next/domain/src/general/deviceMigration/qrCodes'
import {
  CURRENT_MIGRATION_PROTOCOL_VERSION,
  CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
  exactVersionMatch,
  type VersionTriple,
} from '@vexl-next/domain/src/general/deviceMigration/version'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Either, Schema} from 'effect'
import {Base64} from 'js-base64'
import {version as appVersion} from '../../environment'

const error = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})
const QR_SCHEMA_VERSION = Schema.decodeSync(Schema.Literal(1))(1)

export const currentMigrationVersion: VersionTriple = {
  appVersion,
  migrationProtocolVersion: CURRENT_MIGRATION_PROTOCOL_VERSION,
  snapshotStorageSchemaVersion: CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
}

function timestamp(value: number): UnixMilliseconds {
  return Schema.decodeSync(UnixMilliseconds)(value)
}

function digestAs<A, I>(
  schema: Schema.Schema<A, I, never>,
  bytes: Uint8Array
): A {
  return Schema.decodeUnknownSync(schema)(bytesToHex(sha256Bytes(bytes)))
}

export interface CreatedPairingQr {
  readonly qrCode: PairingQrCode
  readonly qrString: string
  readonly sourceKeyPair: MigrationKxKeyPair
  readonly pairingCapability: PairingCapability
  readonly transferId: TransferId
}

/** Every regeneration creates fresh KX keys, capability and transfer id. */
export function createPairingQr(args: {
  readonly endpoints: readonly [
    MigrationEndpointCandidate,
    ...MigrationEndpointCandidate[],
  ]
  readonly now?: () => number
  readonly version?: VersionTriple
  readonly transferId?: TransferId
}): Effect.Effect<CreatedPairingQr, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const now = (args.now ?? Date.now)()
    const sourceKeyPair = yield* _(
      Effect.tryPromise({
        try: generateEphemeralKxKeyPair,
        catch: () => error('handshakeFailed'),
      })
    )
    const pairingCapability = yield* _(randomBranded(PairingCapability))
    const transferId = args.transferId ?? (yield* _(randomBranded(TransferId)))
    const qrCode = yield* _(
      Effect.try({
        try: () =>
          new PairingQrCode({
            qrSchemaVersion: QR_SCHEMA_VERSION,
            version: args.version ?? currentMigrationVersion,
            transferId,
            issuedAt: timestamp(now),
            expiresAt: timestamp(now + QR_CODE_EXPIRY_MS),
            endpointCandidates: args.endpoints,
            sourceKeyExchangePublicKey: Schema.decodeSync(
              MigrationKeyExchangePublicKey
            )(Base64.fromUint8Array(sourceKeyPair.publicKey)),
            pairingCapability,
          }),
        catch: () => error('schemaInvalid'),
      })
    )
    const encoded = qrCode.encodeToQrString()
    if (Either.isLeft(encoded)) return yield* _(Effect.fail(encoded.left))
    return {
      qrCode,
      qrString: encoded.right,
      sourceKeyPair,
      pairingCapability,
      transferId,
    }
  })
}

function randomBranded<A, I>(
  schema: Schema.Schema<A, I, never>
): Effect.Effect<A, DeviceMigrationError> {
  return Effect.tryPromise({
    try: async () =>
      Schema.decodeUnknownSync(schema)(await generateRandomBase64Url(32)),
    catch: () => error('schemaInvalid'),
  })
}

export function parseAndValidatePairingQr(args: {
  readonly qrString: string
  readonly expectedVersion?: VersionTriple
  readonly now?: () => number
}): Effect.Effect<PairingQrCode, DeviceMigrationError> {
  const decoded = PairingQrCode.decodeFromQrString(args.qrString)
  if (Either.isLeft(decoded)) return Effect.fail(decoded.left)
  const notExpired = validateQrCodeNotExpired(
    decoded.right,
    timestamp((args.now ?? Date.now)())
  )
  if (Either.isLeft(notExpired)) return Effect.fail(notExpired.left)
  if (
    !exactVersionMatch(
      decoded.right.version,
      args.expectedVersion ?? currentMigrationVersion
    )
  )
    return Effect.fail(error('versionMismatch'))
  return Effect.succeed(decoded.right)
}

export interface EraseCommandBindings {
  readonly version: VersionTriple
  readonly transferId: TransferId
  readonly manifestDigest: ManifestDigest
  readonly snapshotContentDigest: SnapshotContentDigest
  readonly stagingReceiptDigest: StagingReceiptDigest
}

export interface CreatedEraseCommand {
  readonly qrCode: EraseCommandQrCode
  readonly qrString: string
  readonly eraseCommandDigest: EraseCommandDigest
}

export function createEraseCommandQr(
  args: EraseCommandBindings & {
    readonly qrMacTxKey: Uint8Array
    readonly now?: () => number
  }
): Effect.Effect<CreatedEraseCommand, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const now = (args.now ?? Date.now)()
    const commandNonce = yield* _(randomBranded(CommandNonce))
    const payload = {
      qrSchemaVersion: QR_SCHEMA_VERSION,
      version: args.version,
      transferId: args.transferId,
      manifestDigest: args.manifestDigest,
      snapshotContentDigest: args.snapshotContentDigest,
      commandNonce,
      issuedAt: timestamp(now),
      expiresAt: timestamp(now + QR_CODE_EXPIRY_MS),
      stagingReceiptDigest: args.stagingReceiptDigest,
    }
    const payloadBytes = eraseCommandQrCodeMacPayloadBytes(payload)
    const mac = yield* _(
      createMac(payloadBytes, args.qrMacTxKey, 'destination')
    )
    const qrCode = new EraseCommandQrCode({...payload, mac})
    const qrString = qrCode.encodeToQrString()
    if (Either.isLeft(qrString)) return yield* _(Effect.fail(qrString.left))
    return {
      qrCode,
      qrString: qrString.right,
      eraseCommandDigest: digestAs(
        EraseCommandDigest,
        concatBytes(payloadBytes, Base64.toUint8Array(mac))
      ),
    }
  })
}

function createMac(
  payload: Uint8Array,
  key: Uint8Array,
  role: 'source' | 'destination'
): Effect.Effect<typeof QrAuthMac.Type, DeviceMigrationError> {
  return Effect.tryPromise({
    try: async () =>
      Schema.decodeSync(QrAuthMac)(
        Base64.fromUint8Array(await createQrMac(payload, key, role))
      ),
    catch: () => error('macInvalid'),
  })
}

function verifyMac(
  mac: string,
  payload: Uint8Array,
  key: Uint8Array,
  role: 'source' | 'destination'
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.tryPromise({
    try: async () =>
      await verifyQrMac(Base64.toUint8Array(mac), payload, key, role),
    catch: () => error('macInvalid'),
  }).pipe(
    Effect.flatMap((valid) =>
      valid ? Effect.void : Effect.fail(error('macInvalid'))
    )
  )
}

function allBindingsMatch(
  value: EraseCommandBindings,
  expected: EraseCommandBindings
): boolean {
  return (
    exactVersionMatch(value.version, expected.version) &&
    value.transferId === expected.transferId &&
    constantTimeEqualStrings(value.manifestDigest, expected.manifestDigest) &&
    constantTimeEqualStrings(
      value.snapshotContentDigest,
      expected.snapshotContentDigest
    ) &&
    constantTimeEqualStrings(
      value.stagingReceiptDigest,
      expected.stagingReceiptDigest
    )
  )
}

export function validateEraseCommandOnSource(args: {
  readonly qrString: string
  readonly expected: EraseCommandBindings
  readonly qrMacRxKey: Uint8Array
  readonly usedNonces: Set<string>
  readonly now?: () => number
}): Effect.Effect<CreatedEraseCommand, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const decoded = EraseCommandQrCode.decodeFromQrString(args.qrString)
    if (Either.isLeft(decoded)) return yield* _(Effect.fail(decoded.left))
    const qrCode = decoded.right
    const notExpired = validateQrCodeNotExpired(
      qrCode,
      timestamp((args.now ?? Date.now)())
    )
    if (Either.isLeft(notExpired)) return yield* _(Effect.fail(notExpired.left))
    if (!allBindingsMatch(qrCode, args.expected))
      return yield* _(Effect.fail(error('digestMismatch')))
    if (args.usedNonces.has(qrCode.commandNonce))
      return yield* _(Effect.fail(error('nonceReused')))
    const payloadBytes = eraseCommandQrCodeMacPayloadBytes(qrCode)
    yield* _(
      verifyMac(qrCode.mac, payloadBytes, args.qrMacRxKey, 'destination')
    )
    args.usedNonces.add(qrCode.commandNonce)
    const encoded = qrCode.encodeToQrString()
    if (Either.isLeft(encoded)) return yield* _(Effect.fail(encoded.left))
    return {
      qrCode,
      qrString: encoded.right,
      eraseCommandDigest: digestAs(
        EraseCommandDigest,
        concatBytes(payloadBytes, Base64.toUint8Array(qrCode.mac))
      ),
    }
  })
}

export interface CancellationBindings {
  readonly version: VersionTriple
  readonly transferId: TransferId
  readonly manifestDigest: ManifestDigest
  readonly snapshotContentDigest: SnapshotContentDigest
}

export function createSourceCancellationConfirmedQr(
  args: CancellationBindings & {
    readonly qrMacTxKey: Uint8Array
    readonly now?: () => number
  }
): Effect.Effect<SourceCancellationConfirmedQrCode, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const payload = {
      qrSchemaVersion: QR_SCHEMA_VERSION,
      version: args.version,
      transferId: args.transferId,
      manifestDigest: args.manifestDigest,
      snapshotContentDigest: args.snapshotContentDigest,
      cancellationNonce: yield* _(randomBranded(ReceiptNonce)),
      issuedAt: timestamp((args.now ?? Date.now)()),
    }
    const mac = yield* _(
      createMac(
        sourceCancellationConfirmedMacPayloadBytes(payload),
        args.qrMacTxKey,
        'source'
      )
    )
    return new SourceCancellationConfirmedQrCode({...payload, mac})
  })
}

export function validateSourceCancellationConfirmed(args: {
  readonly qrString: string
  readonly expected: CancellationBindings
  readonly qrMacRxKey: Uint8Array
  readonly usedNonces: Set<string>
}): Effect.Effect<SourceCancellationConfirmedQrCode, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const decoded = SourceCancellationConfirmedQrCode.decodeFromQrString(
      args.qrString
    )
    if (Either.isLeft(decoded)) return yield* _(Effect.fail(decoded.left))
    const value = decoded.right
    if (
      !exactVersionMatch(value.version, args.expected.version) ||
      value.transferId !== args.expected.transferId ||
      !constantTimeEqualStrings(
        value.manifestDigest,
        args.expected.manifestDigest
      ) ||
      !constantTimeEqualStrings(
        value.snapshotContentDigest,
        args.expected.snapshotContentDigest
      )
    )
      return yield* _(Effect.fail(error('digestMismatch')))
    if (args.usedNonces.has(value.cancellationNonce))
      return yield* _(Effect.fail(error('nonceReused')))
    yield* _(
      verifyMac(
        value.mac,
        sourceCancellationConfirmedMacPayloadBytes(value),
        args.qrMacRxKey,
        'source'
      )
    )
    args.usedNonces.add(value.cancellationNonce)
    return value
  })
}

export interface SourceErasedBindings extends CancellationBindings {
  readonly acceptedEraseCommandDigest: EraseCommandDigest
  readonly acceptedEraseCommandNonce: CommandNonce
}

export function createSourceErasedReceiptQr(
  args: SourceErasedBindings & {
    readonly cleanupResultDigest: CleanupResultDigest
    readonly qrMacTxKey: Uint8Array
    readonly now?: () => number
  }
): Effect.Effect<SourceErasedReceiptQrCode, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const payload = {
      qrSchemaVersion: QR_SCHEMA_VERSION,
      version: args.version,
      transferId: args.transferId,
      manifestDigest: args.manifestDigest,
      snapshotContentDigest: args.snapshotContentDigest,
      acceptedEraseCommandDigest: args.acceptedEraseCommandDigest,
      acceptedEraseCommandNonce: args.acceptedEraseCommandNonce,
      receiptNonce: yield* _(randomBranded(ReceiptNonce)),
      cleanupResultDigest: args.cleanupResultDigest,
      issuedAt: timestamp((args.now ?? Date.now)()),
    }
    const mac = yield* _(
      createMac(
        sourceErasedReceiptMacPayloadBytes(payload),
        args.qrMacTxKey,
        'source'
      )
    )
    return new SourceErasedReceiptQrCode({...payload, mac})
  })
}

/** Receipt deliberately has no expiry. */
export function validateSourceErasedReceiptOnDestination(args: {
  readonly qrString: string
  readonly expected: SourceErasedBindings
  readonly qrMacRxKey: Uint8Array
  readonly usedNonces: Set<string>
}): Effect.Effect<SourceErasedReceiptQrCode, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const decoded = SourceErasedReceiptQrCode.decodeFromQrString(args.qrString)
    if (Either.isLeft(decoded)) return yield* _(Effect.fail(decoded.left))
    const value = decoded.right
    if (
      !exactVersionMatch(value.version, args.expected.version) ||
      value.transferId !== args.expected.transferId ||
      !constantTimeEqualStrings(
        value.manifestDigest,
        args.expected.manifestDigest
      ) ||
      !constantTimeEqualStrings(
        value.snapshotContentDigest,
        args.expected.snapshotContentDigest
      ) ||
      !constantTimeEqualStrings(
        value.acceptedEraseCommandDigest,
        args.expected.acceptedEraseCommandDigest
      ) ||
      value.acceptedEraseCommandNonce !==
        args.expected.acceptedEraseCommandNonce
    )
      return yield* _(Effect.fail(error('receiptInvalid')))
    if (args.usedNonces.has(value.receiptNonce))
      return yield* _(Effect.fail(error('nonceReused')))
    yield* _(
      verifyMac(
        value.mac,
        sourceErasedReceiptMacPayloadBytes(value),
        args.qrMacRxKey,
        'source'
      )
    )
    args.usedNonces.add(value.receiptNonce)
    return value
  })
}
