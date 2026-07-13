import {Schema} from 'effect'
import {Base64} from 'js-base64'
import {UnixMilliseconds} from '../../utility/UnixMilliseconds.brand'
import {
  CleanupResultDigest,
  CommandNonce,
  EraseCommandDigest,
  ManifestDigest,
  MigrationKeyExchangePublicKey,
  QrAuthMac,
  ReceiptNonce,
  Sha256Hex,
  SnapshotContentDigest,
  StagingReceiptDigest,
  TransferId,
} from './brands'
import {
  MAX_DATA_CHUNK_PLAINTEXT_BYTES,
  MAX_FILE_BYTES,
  MAX_MMKV_VALUE_BYTES,
} from './limits'
import {
  MmkvEntryKey,
  MmkvNativeType,
  NormalizedRelativeFilePath,
} from './snapshotEntries'
import {SnapshotManifest} from './snapshotManifest'
import {VersionTriple} from './version'

/**
 * Local protocol messages (spec section "Local protocol messages"). All
 * messages are typed, role-bound and travel encrypted after the initial
 * hello. Inbound frames must be decoded exclusively through
 * `Schema.decodeUnknown(DeviceMigrationProtocolMessage)` so unknown tags and
 * messages invalid for the current state fail closed and terminate the
 * connection. No state transition may depend only on an unpersisted message.
 */
export const MigrationRole = Schema.Literal('source', 'destination')
export type MigrationRole = typeof MigrationRole.Type

const SourceSender = Schema.Literal('source')
const DestinationSender = Schema.Literal('destination')

const NonNegativeInt = Schema.Number.pipe(Schema.int(), Schema.nonNegative())

// Upper bound of the base64 string length of one maximum-size chunk. Checked
// before decoding so oversize payloads are rejected without allocation.
const MAX_DATA_CHUNK_BASE64_LENGTH =
  Math.ceil((MAX_DATA_CHUNK_PLAINTEXT_BYTES * 4) / 3) + 4

const DataChunkPayload = Schema.String.pipe(
  Schema.filter(
    (value) =>
      value.length <= MAX_DATA_CHUNK_BASE64_LENGTH &&
      Base64.isValid(value) &&
      Base64.toUint8Array(value).length <= MAX_DATA_CHUNK_PLAINTEXT_BYTES,
    {
      message: () => 'Data chunk payload is not base64 or exceeds the limit',
    }
  )
)

/** First message; sent by the destination after scanning the pairing QR. */
export class ClientHello extends Schema.TaggedClass<ClientHello>('ClientHello')(
  'ClientHello',
  {
    sender: DestinationSender,
    version: VersionTriple,
    transferId: TransferId,
    keyExchangePublicKey: MigrationKeyExchangePublicKey,
  }
) {
  static parseUnkownOption = Schema.decodeUnknownOption(ClientHello)
  toData = (): typeof ClientHello.Encoded =>
    Schema.encodeSync(ClientHello)(this)
}

/** Source's handshake reply; re-binds the QR transcript fields. */
export class SourceHello extends Schema.TaggedClass<SourceHello>('SourceHello')(
  'SourceHello',
  {
    sender: SourceSender,
    version: VersionTriple,
    transferId: TransferId,
    keyExchangePublicKey: MigrationKeyExchangePublicKey,
  }
) {
  static parseUnkownOption = Schema.decodeUnknownOption(SourceHello)
  toData = (): typeof SourceHello.Encoded =>
    Schema.encodeSync(SourceHello)(this)
}

/** Destination proof of knowledge of the one-time QR pairing capability. */
export class PairingProof extends Schema.TaggedClass<PairingProof>(
  'PairingProof'
)('PairingProof', {
  sender: DestinationSender,
  transferId: TransferId,
  proof: QrAuthMac,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(PairingProof)
  toData = (): typeof PairingProof.Encoded =>
    Schema.encodeSync(PairingProof)(this)
}

/** Source accepted the pairing proof; at most one destination is accepted. */
export class PairingAccepted extends Schema.TaggedClass<PairingAccepted>(
  'PairingAccepted'
)('PairingAccepted', {
  sender: SourceSender,
  transferId: TransferId,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(PairingAccepted)
  toData = (): typeof PairingAccepted.Encoded =>
    Schema.encodeSync(PairingAccepted)(this)
}

/** The user confirmed the short authentication code on one device. */
export class HumanCodeConfirmed extends Schema.TaggedClass<HumanCodeConfirmed>(
  'HumanCodeConfirmed'
)('HumanCodeConfirmed', {
  sender: MigrationRole,
  transferId: TransferId,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(HumanCodeConfirmed)
  toData = (): typeof HumanCodeConfirmed.Encoded =>
    Schema.encodeSync(HumanCodeConfirmed)(this)
}

/** Carries the complete snapshot manifest ahead of the record stream. */
export class SnapshotManifestMessage extends Schema.TaggedClass<SnapshotManifestMessage>(
  'SnapshotManifest'
)('SnapshotManifest', {
  sender: SourceSender,
  manifest: SnapshotManifest,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(SnapshotManifestMessage)
  toData = (): typeof SnapshotManifestMessage.Encoded =>
    Schema.encodeSync(SnapshotManifestMessage)(this)
}

/** Start of one typed MMKV entry record. */
export class MmkvEntryStart extends Schema.TaggedClass<MmkvEntryStart>(
  'MmkvEntryStart'
)('MmkvEntryStart', {
  sender: SourceSender,
  key: MmkvEntryKey,
  nativeType: MmkvNativeType,
  byteLength: NonNegativeInt.pipe(
    Schema.lessThanOrEqualTo(MAX_MMKV_VALUE_BYTES)
  ),
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(MmkvEntryStart)
  toData = (): typeof MmkvEntryStart.Encoded =>
    Schema.encodeSync(MmkvEntryStart)(this)
}

/**
 * One data chunk of the currently open MMKV entry or file record. Chunks
 * are strictly ordered by sequence number and limited to 64 KiB plaintext.
 */
export class DataChunk extends Schema.TaggedClass<DataChunk>('DataChunk')(
  'DataChunk',
  {
    sender: SourceSender,
    sequenceNumber: NonNegativeInt,
    payload: DataChunkPayload,
  }
) {
  static parseUnkownOption = Schema.decodeUnknownOption(DataChunk)
  toData = (): typeof DataChunk.Encoded => Schema.encodeSync(DataChunk)(this)
}

/** End of one MMKV entry record with its content digest. */
export class EntryEnd extends Schema.TaggedClass<EntryEnd>('EntryEnd')(
  'EntryEnd',
  {
    sender: SourceSender,
    key: MmkvEntryKey,
    sha256: Sha256Hex,
  }
) {
  static parseUnkownOption = Schema.decodeUnknownOption(EntryEnd)
  toData = (): typeof EntryEnd.Encoded => Schema.encodeSync(EntryEnd)(this)
}

/** Start of one file record. */
export class FileStart extends Schema.TaggedClass<FileStart>('FileStart')(
  'FileStart',
  {
    sender: SourceSender,
    path: NormalizedRelativeFilePath,
    byteLength: NonNegativeInt.pipe(Schema.lessThanOrEqualTo(MAX_FILE_BYTES)),
  }
) {
  static parseUnkownOption = Schema.decodeUnknownOption(FileStart)
  toData = (): typeof FileStart.Encoded => Schema.encodeSync(FileStart)(this)
}

/** End of one file record with its content digest. */
export class FileEnd extends Schema.TaggedClass<FileEnd>('FileEnd')('FileEnd', {
  sender: SourceSender,
  path: NormalizedRelativeFilePath,
  sha256: Sha256Hex,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(FileEnd)
  toData = (): typeof FileEnd.Encoded => Schema.encodeSync(FileEnd)(this)
}

/** End of the snapshot stream; commits the source-computed digests. */
export class SnapshotEnd extends Schema.TaggedClass<SnapshotEnd>('SnapshotEnd')(
  'SnapshotEnd',
  {
    sender: SourceSender,
    manifestDigest: ManifestDigest,
    snapshotContentDigest: SnapshotContentDigest,
  }
) {
  static parseUnkownOption = Schema.decodeUnknownOption(SnapshotEnd)
  toData = (): typeof SnapshotEnd.Encoded =>
    Schema.encodeSync(SnapshotEnd)(this)
}

/**
 * Destination durably staged and validated the complete snapshot and
 * independently recomputed the snapshot content digest.
 */
export class DestinationStaged extends Schema.TaggedClass<DestinationStaged>(
  'DestinationStaged'
)('DestinationStaged', {
  sender: DestinationSender,
  transferId: TransferId,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
  stagingReceiptDigest: StagingReceiptDigest,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(DestinationStaged)
  toData = (): typeof DestinationStaged.Encoded =>
    Schema.encodeSync(DestinationStaged)(this)
}

/** Either device requests a safe cancellation. */
export class CancelRequested extends Schema.TaggedClass<CancelRequested>(
  'CancelRequested'
)('CancelRequested', {
  sender: MigrationRole,
  transferId: TransferId,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(CancelRequested)
  toData = (): typeof CancelRequested.Encoded =>
    Schema.encodeSync(CancelRequested)(this)
}

/**
 * Authenticated proof that the source never accepted the erase command and
 * has returned to normal mode. LAN twin of
 * `SourceCancellationConfirmedQrCode`; both encodings carry the same fields
 * and MAC and must produce identical validated domain records.
 */
export class SourceCancellationConfirmed extends Schema.TaggedClass<SourceCancellationConfirmed>(
  'SourceCancellationConfirmed'
)('SourceCancellationConfirmed', {
  sender: SourceSender,
  qrSchemaVersion: Schema.Literal(1),
  version: VersionTriple,
  transferId: TransferId,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
  cancellationNonce: ReceiptNonce,
  issuedAt: UnixMilliseconds,
  mac: QrAuthMac,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(
    SourceCancellationConfirmed
  )

  toData = (): typeof SourceCancellationConfirmed.Encoded =>
    Schema.encodeSync(SourceCancellationConfirmed)(this)
}

/**
 * The source authenticated the erase-command QR and durably persisted the
 * irreversible retirement commitment.
 */
export class EraseCommandAccepted extends Schema.TaggedClass<EraseCommandAccepted>(
  'EraseCommandAccepted'
)('EraseCommandAccepted', {
  sender: SourceSender,
  transferId: TransferId,
  eraseCommandDigest: EraseCommandDigest,
  commandNonce: CommandNonce,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(EraseCommandAccepted)
  toData = (): typeof EraseCommandAccepted.Encoded =>
    Schema.encodeSync(EraseCommandAccepted)(this)
}

/**
 * Source-erased receipt over LAN. Twin of `SourceErasedReceiptQrCode`; both
 * encodings carry the same fields and MAC and must produce identical
 * validated domain records.
 */
export class SourceErased extends Schema.TaggedClass<SourceErased>(
  'SourceErased'
)('SourceErased', {
  sender: SourceSender,
  qrSchemaVersion: Schema.Literal(1),
  version: VersionTriple,
  transferId: TransferId,
  manifestDigest: ManifestDigest,
  snapshotContentDigest: SnapshotContentDigest,
  acceptedEraseCommandDigest: EraseCommandDigest,
  acceptedEraseCommandNonce: CommandNonce,
  receiptNonce: ReceiptNonce,
  cleanupResultDigest: CleanupResultDigest,
  issuedAt: UnixMilliseconds,
  mac: QrAuthMac,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(SourceErased)
  toData = (): typeof SourceErased.Encoded =>
    Schema.encodeSync(SourceErased)(this)
}

/** Destination durably stored and validated the source-erased receipt. */
export class DestinationReceiptStored extends Schema.TaggedClass<DestinationReceiptStored>(
  'DestinationReceiptStored'
)('DestinationReceiptStored', {
  sender: DestinationSender,
  transferId: TransferId,
  receiptNonce: ReceiptNonce,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(
    DestinationReceiptStored
  )

  toData = (): typeof DestinationReceiptStored.Encoded =>
    Schema.encodeSync(DestinationReceiptStored)(this)
}

/**
 * Destination installed the snapshot and activated. The source may delete
 * its migration recovery state after receiving this.
 */
export class DestinationActivated extends Schema.TaggedClass<DestinationActivated>(
  'DestinationActivated'
)('DestinationActivated', {
  sender: DestinationSender,
  transferId: TransferId,
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(DestinationActivated)
  toData = (): typeof DestinationActivated.Encoded =>
    Schema.encodeSync(DestinationActivated)(this)
}

/** Orderly connection close. The reason is a non-sensitive enumerated code. */
export class Close extends Schema.TaggedClass<Close>('Close')('Close', {
  sender: MigrationRole,
  reason: Schema.Literal('done', 'cancelled', 'error'),
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(Close)
  toData = (): typeof Close.Encoded => Schema.encodeSync(Close)(this)
}

/**
 * Union of every local protocol message. Inbound frames must be decoded
 * exclusively through `Schema.decodeUnknown` of this union — unknown `_tag`
 * values fail closed.
 */
export const DeviceMigrationProtocolMessage = Schema.Union(
  ClientHello,
  SourceHello,
  PairingProof,
  PairingAccepted,
  HumanCodeConfirmed,
  SnapshotManifestMessage,
  MmkvEntryStart,
  DataChunk,
  EntryEnd,
  FileStart,
  FileEnd,
  SnapshotEnd,
  DestinationStaged,
  CancelRequested,
  SourceCancellationConfirmed,
  EraseCommandAccepted,
  SourceErased,
  DestinationReceiptStored,
  DestinationActivated,
  Close
)
export type DeviceMigrationProtocolMessage =
  typeof DeviceMigrationProtocolMessage.Type
