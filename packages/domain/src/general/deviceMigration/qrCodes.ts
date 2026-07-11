import {Either, pipe, Schema} from 'effect'
import {Base64} from 'js-base64'
import {UnixMilliseconds} from '../../utility/UnixMilliseconds.brand'
import {
  CleanupResultDigest,
  CommandNonce,
  EraseCommandDigest,
  ManifestDigest,
  MigrationKeyExchangePublicKey,
  PairingCapability,
  QrAuthMac,
  ReceiptNonce,
  SnapshotContentDigest,
  StagingReceiptDigest,
  TransferId,
} from './brands'
import {SNAPSHOT_DIGEST_DOMAIN_TAG} from './contentDigest'
import {
  concatBytes,
  hexToBytes,
  lengthPrefixed,
  u32be,
  u64be,
  utf8Encode,
} from './encoding'
import {DeviceMigrationError} from './errors'
import {MAX_QR_PAYLOAD_BYTES} from './limits'
import {VersionTriple} from './version'

/**
 * Authenticated QR payloads of device migration. Every QR string is the
 * url-safe base64 encoding (no padding) of the JSON-encoded payload and must
 * not exceed {@link MAX_QR_PAYLOAD_BYTES} after encoding.
 *
 * QR payloads are sensitive migration metadata: they are displayed with
 * forced capture protection and never logged, reported, or sent to Vexl.
 */
export const QrSchemaVersion = Schema.Literal(1)

const QR_STRING_PATTERN = /^[A-Za-z0-9_-]+$/

const decodeQrPayload =
  <Self, I>(schema: Schema.Schema<Self, I, never>) =>
  (qrString: string): Either.Either<Self, DeviceMigrationError> => {
    if (qrString.length > MAX_QR_PAYLOAD_BYTES)
      return Either.left(new DeviceMigrationError({code: 'limitExceeded'}))
    if (!QR_STRING_PATTERN.test(qrString))
      return Either.left(new DeviceMigrationError({code: 'qrInvalid'}))
    return pipe(
      Either.try({
        try: () => Base64.decode(qrString),
        catch: () => new DeviceMigrationError({code: 'qrInvalid'}),
      }),
      Either.flatMap((json) =>
        pipe(
          Schema.decodeUnknownEither(Schema.parseJson(schema))(json),
          Either.mapLeft(() => new DeviceMigrationError({code: 'qrInvalid'}))
        )
      )
    )
  }

const encodeQrPayload =
  <Self, I>(schema: Schema.Schema<Self, I, never>) =>
  (value: Self): Either.Either<string, DeviceMigrationError> =>
    pipe(
      Schema.encodeEither(Schema.parseJson(schema))(value),
      Either.mapLeft(() => new DeviceMigrationError({code: 'schemaInvalid'})),
      Either.flatMap((json) => {
        const encoded = Base64.encodeURI(json)
        // base64url is pure ASCII, so string length equals byte length
        return encoded.length <= MAX_QR_PAYLOAD_BYTES
          ? Either.right(encoded)
          : Either.left(new DeviceMigrationError({code: 'limitExceeded'}))
      })
    )

export const isQrCodeExpired = (
  qrCode: {readonly expiresAt: UnixMilliseconds},
  now: UnixMilliseconds
): boolean => now > qrCode.expiresAt

export const validateQrCodeNotExpired = <
  T extends {readonly expiresAt: UnixMilliseconds},
>(
  qrCode: T,
  now: UnixMilliseconds
): Either.Either<T, DeviceMigrationError> =>
  isQrCodeExpired(qrCode, now)
    ? Either.left(new DeviceMigrationError({code: 'qrExpired'}))
    : Either.right(qrCode)

/** Deterministic binary encoding of one version triple for MAC payloads. */
export const versionTripleBytes = (version: VersionTriple): Uint8Array =>
  concatBytes(
    lengthPrefixed(utf8Encode(version.appVersion)),
    u32be(version.migrationProtocolVersion),
    u32be(version.snapshotStorageSchemaVersion)
  )

export const MigrationEndpointCandidate = Schema.Struct({
  host: Schema.NonEmptyString,
  port: Schema.Number.pipe(Schema.int(), Schema.between(1, 65535)),
})
export type MigrationEndpointCandidate = typeof MigrationEndpointCandidate.Type

/**
 * Initial pairing QR displayed by the source (spec section "Initial pairing
 * QR"). Contains no account/session keys, phone numbers, contacts, snapshot
 * data, or Vexl credentials. Short-lived and single-use.
 */
export class PairingQrCode extends Schema.TaggedClass<PairingQrCode>(
  'PairingQrCode'
)('PairingQrCode', {
  qrSchemaVersion: QrSchemaVersion,
  version: VersionTriple,
  transferId: TransferId,
  issuedAt: UnixMilliseconds,
  expiresAt: UnixMilliseconds,
  endpointCandidates: Schema.NonEmptyArray(MigrationEndpointCandidate),
  sourceKeyExchangePublicKey: MigrationKeyExchangePublicKey,
  pairingCapability: PairingCapability,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(PairingQrCode)
  static decodeFromQrString = (
    qrString: string
  ): Either.Either<PairingQrCode, DeviceMigrationError> =>
    decodeQrPayload(PairingQrCode)(qrString)

  toData = (): typeof PairingQrCode.Encoded =>
    Schema.encodeSync(PairingQrCode)(this)

  encodeToQrString = (): Either.Either<string, DeviceMigrationError> =>
    encodeQrPayload(PairingQrCode)(this)
}

const eraseCommandQrCodeMacFields = {
  qrSchemaVersion: QrSchemaVersion,
  version: VersionTriple,
  transferId: TransferId,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
  commandNonce: CommandNonce,
  issuedAt: UnixMilliseconds,
  expiresAt: UnixMilliseconds,
  stagingReceiptDigest: StagingReceiptDigest,
}

const EraseCommandQrCodeMacPayload = Schema.Struct(eraseCommandQrCodeMacFields)
export type EraseCommandQrCodeMacPayload =
  typeof EraseCommandQrCodeMacPayload.Type

/**
 * Deterministic bytes the erase-command MAC is computed over — every field
 * of the command except the MAC itself, concatenated with explicit length
 * prefixes (never JSON.stringify, whose property order is not canonical).
 */
export const eraseCommandQrCodeMacPayloadBytes = (
  payload: EraseCommandQrCodeMacPayload
): Uint8Array =>
  concatBytes(
    lengthPrefixed(
      utf8Encode(`${SNAPSHOT_DIGEST_DOMAIN_TAG}/mac/eraseCommand`)
    ),
    u32be(payload.qrSchemaVersion),
    versionTripleBytes(payload.version),
    lengthPrefixed(utf8Encode(payload.transferId)),
    lengthPrefixed(hexToBytes(payload.manifestDigest)),
    lengthPrefixed(hexToBytes(payload.snapshotContentDigest)),
    lengthPrefixed(utf8Encode(payload.commandNonce)),
    u64be(payload.issuedAt),
    u64be(payload.expiresAt),
    lengthPrefixed(hexToBytes(payload.stagingReceiptDigest))
  )

/**
 * Authenticated erase-command QR created by the destination only after the
 * complete snapshot is durably staged and validated (spec section
 * "Erase-command QR and local commit"). Source acceptance is the
 * irreversible commit point. Short-lived, single-use nonce, MAC made with
 * the destination-to-source QR-authentication key.
 */
export class EraseCommandQrCode extends Schema.TaggedClass<EraseCommandQrCode>(
  'EraseCommandQrCode'
)('EraseCommandQrCode', {
  ...eraseCommandQrCodeMacFields,
  mac: QrAuthMac,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(EraseCommandQrCode)
  static decodeFromQrString = (
    qrString: string
  ): Either.Either<EraseCommandQrCode, DeviceMigrationError> =>
    decodeQrPayload(EraseCommandQrCode)(qrString)

  toData = (): typeof EraseCommandQrCode.Encoded =>
    Schema.encodeSync(EraseCommandQrCode)(this)

  encodeToQrString = (): Either.Either<string, DeviceMigrationError> =>
    encodeQrPayload(EraseCommandQrCode)(this)

  macPayloadBytes = (): Uint8Array => eraseCommandQrCodeMacPayloadBytes(this)
}

const sourceCancellationConfirmedMacFields = {
  qrSchemaVersion: QrSchemaVersion,
  version: VersionTriple,
  transferId: TransferId,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
  cancellationNonce: ReceiptNonce,
  issuedAt: UnixMilliseconds,
}

const SourceCancellationConfirmedMacPayload = Schema.Struct(
  sourceCancellationConfirmedMacFields
)
export type SourceCancellationConfirmedMacPayload =
  typeof SourceCancellationConfirmedMacPayload.Type

export const sourceCancellationConfirmedMacPayloadBytes = (
  payload: SourceCancellationConfirmedMacPayload
): Uint8Array =>
  concatBytes(
    lengthPrefixed(
      utf8Encode(`${SNAPSHOT_DIGEST_DOMAIN_TAG}/mac/sourceCancellation`)
    ),
    u32be(payload.qrSchemaVersion),
    versionTripleBytes(payload.version),
    lengthPrefixed(utf8Encode(payload.transferId)),
    lengthPrefixed(hexToBytes(payload.manifestDigest)),
    lengthPrefixed(hexToBytes(payload.snapshotContentDigest)),
    lengthPrefixed(utf8Encode(payload.cancellationNonce)),
    u64be(payload.issuedAt)
  )

/**
 * Authenticated proof that the source never accepted the erase command and
 * has returned to normal mode (spec section "Cancellation before the erase
 * command"). It is the only record besides the source-erased receipt that
 * allows the destination to delete staging after the erase-command QR was
 * displayed. MAC made with the source-to-destination QR-authentication key.
 */
export class SourceCancellationConfirmedQrCode extends Schema.TaggedClass<SourceCancellationConfirmedQrCode>(
  'SourceCancellationConfirmedQrCode'
)('SourceCancellationConfirmedQrCode', {
  ...sourceCancellationConfirmedMacFields,
  mac: QrAuthMac,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(
    SourceCancellationConfirmedQrCode
  )

  static decodeFromQrString = (
    qrString: string
  ): Either.Either<SourceCancellationConfirmedQrCode, DeviceMigrationError> =>
    decodeQrPayload(SourceCancellationConfirmedQrCode)(qrString)

  toData = (): typeof SourceCancellationConfirmedQrCode.Encoded =>
    Schema.encodeSync(SourceCancellationConfirmedQrCode)(this)

  encodeToQrString = (): Either.Either<string, DeviceMigrationError> =>
    encodeQrPayload(SourceCancellationConfirmedQrCode)(this)

  macPayloadBytes = (): Uint8Array =>
    sourceCancellationConfirmedMacPayloadBytes(this)
}

const sourceErasedReceiptMacFields = {
  qrSchemaVersion: QrSchemaVersion,
  version: VersionTriple,
  transferId: TransferId,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
  acceptedEraseCommandDigest: EraseCommandDigest,
  acceptedEraseCommandNonce: CommandNonce,
  receiptNonce: ReceiptNonce,
  cleanupResultDigest: CleanupResultDigest,
  issuedAt: UnixMilliseconds,
}

const SourceErasedReceiptMacPayload = Schema.Struct(
  sourceErasedReceiptMacFields
)
export type SourceErasedReceiptMacPayload =
  typeof SourceErasedReceiptMacPayload.Type

export const sourceErasedReceiptMacPayloadBytes = (
  payload: SourceErasedReceiptMacPayload
): Uint8Array =>
  concatBytes(
    lengthPrefixed(
      utf8Encode(`${SNAPSHOT_DIGEST_DOMAIN_TAG}/mac/sourceErasedReceipt`)
    ),
    u32be(payload.qrSchemaVersion),
    versionTripleBytes(payload.version),
    lengthPrefixed(utf8Encode(payload.transferId)),
    lengthPrefixed(hexToBytes(payload.manifestDigest)),
    lengthPrefixed(hexToBytes(payload.snapshotContentDigest)),
    lengthPrefixed(hexToBytes(payload.acceptedEraseCommandDigest)),
    lengthPrefixed(utf8Encode(payload.acceptedEraseCommandNonce)),
    lengthPrefixed(utf8Encode(payload.receiptNonce)),
    lengthPrefixed(hexToBytes(payload.cleanupResultDigest)),
    u64be(payload.issuedAt)
  )

/**
 * Authenticated source-erased receipt (spec section "Source-erased receipt
 * and recovery QR"). Created only after every retirement step and read-back
 * verification succeeds. Unlike the pairing and erase-command QRs it
 * deliberately has no expiry — expiring it could permanently strand a valid
 * staged account. Single-use. MAC made with the source-to-destination
 * QR-authentication key.
 */
export class SourceErasedReceiptQrCode extends Schema.TaggedClass<SourceErasedReceiptQrCode>(
  'SourceErasedReceiptQrCode'
)('SourceErasedReceiptQrCode', {
  ...sourceErasedReceiptMacFields,
  mac: QrAuthMac,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(
    SourceErasedReceiptQrCode
  )

  static decodeFromQrString = (
    qrString: string
  ): Either.Either<SourceErasedReceiptQrCode, DeviceMigrationError> =>
    decodeQrPayload(SourceErasedReceiptQrCode)(qrString)

  toData = (): typeof SourceErasedReceiptQrCode.Encoded =>
    Schema.encodeSync(SourceErasedReceiptQrCode)(this)

  encodeToQrString = (): Either.Either<string, DeviceMigrationError> =>
    encodeQrPayload(SourceErasedReceiptQrCode)(this)

  macPayloadBytes = (): Uint8Array => sourceErasedReceiptMacPayloadBytes(this)
}
