import {sha256Bytes} from '@vexl-next/cryptography/src/operations/deviceMigration/sha256'
import {
  StagingReceiptDigest,
  type TransferId,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {
  bytesToHex,
  concatBytes,
  utf8Encode,
} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {MAX_TOTAL_SNAPSHOT_BYTES} from '@vexl-next/domain/src/general/deviceMigration/limits'
import {
  DestinationStaged,
  type DestinationActivated,
  type DestinationReceiptStored,
  type DeviceMigrationProtocolMessage,
  type SourceCancellationConfirmed,
  type SourceErased,
} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {
  MmkvEntry,
  type MmkvNativeType,
} from '@vexl-next/domain/src/general/deviceMigration/snapshotEntries'
import {Effect, Either, Schema} from 'effect'
import {Base64} from 'js-base64'
import {
  verifyStagingComplete,
  type DeviceMigrationStaging,
} from '../snapshot/stagingStore'
import {type EncryptedProtocolChannel} from './encryptedChannel'

const fail = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

function combine(chunks: readonly Uint8Array[], total: number): Uint8Array {
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

function decodeEntry(args: {
  readonly key: string
  readonly type: MmkvNativeType
  readonly bytes: Uint8Array
}): Effect.Effect<MmkvEntry, DeviceMigrationError> {
  let value: unknown
  if (args.type === 'string') value = new TextDecoder().decode(args.bytes)
  else if (args.type === 'boolean') {
    if (args.bytes.length !== 1 || (args.bytes[0] !== 0 && args.bytes[0] !== 1))
      return Effect.fail(fail('schemaInvalid'))
    value = args.bytes[0] === 1
  } else if (args.type === 'number') {
    if (args.bytes.length !== 8) return Effect.fail(fail('schemaInvalid'))
    value = new DataView(
      args.bytes.buffer,
      args.bytes.byteOffset,
      args.bytes.byteLength
    ).getFloat64(0, false)
  } else value = Base64.fromUint8Array(args.bytes)
  const candidate =
    args.type === 'buffer'
      ? {type: args.type, key: args.key, value, byteLength: args.bytes.length}
      : {type: args.type, key: args.key, value}
  const decoded = Schema.decodeUnknownEither(MmkvEntry)(candidate)
  return Either.isRight(decoded)
    ? Effect.succeed(decoded.right)
    : Effect.fail(fail('schemaInvalid'))
}

export interface ReceivedSnapshot {
  readonly destinationStaged: DestinationStaged
}

/** Strictly receives manifest → entries → session bytes → files → end. */
export function receiveSnapshot(args: {
  readonly channel: EncryptedProtocolChannel
  readonly staging: DeviceMigrationStaging
  readonly transferId: TransferId
}): Effect.Effect<ReceivedSnapshot, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const first = yield* _(args.channel.nextMessage())
    if (first._tag !== 'SnapshotManifest')
      return yield* _(Effect.fail(fail('stateInvalid')))
    const manifest = first.manifest
    yield* _(args.staging.stageManifest(manifest))
    let expectedSequence = 0
    let totalReceived = 0

    for (const descriptor of manifest.mmkvEntries) {
      const start = yield* _(args.channel.nextMessage())
      if (
        start._tag !== 'MmkvEntryStart' ||
        start.key !== descriptor.key ||
        start.nativeType !== descriptor.type ||
        start.byteLength !== descriptor.byteLength
      )
        return yield* _(Effect.fail(fail('stateInvalid')))
      const chunks: Uint8Array[] = []
      let received = 0
      for (;;) {
        const message = yield* _(args.channel.nextMessage())
        if (message._tag === 'DataChunk') {
          if (message.sequenceNumber !== expectedSequence)
            return yield* _(Effect.fail(fail('stateInvalid')))
          expectedSequence += 1
          const bytes = Base64.toUint8Array(message.payload)
          received += bytes.length
          totalReceived += bytes.length
          if (
            received > descriptor.byteLength ||
            totalReceived > MAX_TOTAL_SNAPSHOT_BYTES
          )
            return yield* _(Effect.fail(fail('limitExceeded')))
          chunks.push(bytes)
          continue
        }
        if (
          message._tag !== 'EntryEnd' ||
          message.key !== descriptor.key ||
          message.sha256 !== descriptor.sha256 ||
          received !== descriptor.byteLength
        )
          return yield* _(Effect.fail(fail('digestMismatch')))
        break
      }
      const entry = yield* _(
        decodeEntry({
          key: descriptor.key,
          type: descriptor.type,
          bytes: combine(chunks, received),
        })
      )
      yield* _(args.staging.stageMmkvEntry(entry))
    }

    // Session boundaries are implicit and fixed by the manifest descriptor.
    const sessionChunks: Uint8Array[] = []
    let sessionReceived = 0
    while (sessionReceived < manifest.session.byteLength) {
      const message = yield* _(args.channel.nextMessage())
      if (
        message._tag !== 'DataChunk' ||
        message.sequenceNumber !== expectedSequence
      )
        return yield* _(Effect.fail(fail('stateInvalid')))
      expectedSequence += 1
      const bytes = Base64.toUint8Array(message.payload)
      sessionReceived += bytes.length
      totalReceived += bytes.length
      if (
        sessionReceived > manifest.session.byteLength ||
        totalReceived > MAX_TOTAL_SNAPSHOT_BYTES
      )
        return yield* _(Effect.fail(fail('limitExceeded')))
      sessionChunks.push(bytes)
    }
    yield* _(
      args.staging.stageSessionJson(
        new TextDecoder().decode(combine(sessionChunks, sessionReceived))
      )
    )

    for (const descriptor of manifest.files) {
      const start = yield* _(args.channel.nextMessage())
      if (
        start._tag !== 'FileStart' ||
        start.path !== descriptor.path ||
        start.byteLength !== descriptor.byteLength
      )
        return yield* _(Effect.fail(fail('stateInvalid')))
      let received = 0
      for (;;) {
        const message = yield* _(args.channel.nextMessage())
        if (message._tag === 'DataChunk') {
          if (message.sequenceNumber !== expectedSequence)
            return yield* _(Effect.fail(fail('stateInvalid')))
          expectedSequence += 1
          const bytes = Base64.toUint8Array(message.payload)
          received += bytes.length
          totalReceived += bytes.length
          if (
            received > descriptor.byteLength ||
            totalReceived > MAX_TOTAL_SNAPSHOT_BYTES
          )
            return yield* _(Effect.fail(fail('limitExceeded')))
          yield* _(args.staging.appendFileChunk(descriptor.path, bytes))
          continue
        }
        if (
          message._tag !== 'FileEnd' ||
          message.path !== descriptor.path ||
          message.sha256 !== descriptor.sha256 ||
          received !== descriptor.byteLength
        )
          return yield* _(Effect.fail(fail('digestMismatch')))
        break
      }
      yield* _(args.staging.finalizeFile(descriptor.path))
    }

    const end = yield* _(args.channel.nextMessage())
    if (
      end._tag !== 'SnapshotEnd' ||
      end.manifestDigest !== manifest.manifestDigest ||
      end.snapshotContentDigest !== manifest.snapshotContentDigest
    )
      return yield* _(Effect.fail(fail('digestMismatch')))
    const verified = yield* _(verifyStagingComplete())
    if (
      verified.manifest.snapshotContentDigest !== manifest.snapshotContentDigest
    )
      return yield* _(Effect.fail(fail('digestMismatch')))
    const stagingReceiptDigest = Schema.decodeSync(StagingReceiptDigest)(
      bytesToHex(
        sha256Bytes(
          concatBytes(
            utf8Encode('vexl-device-migration-staging-receipt-v1'),
            utf8Encode(manifest.manifestDigest),
            utf8Encode(manifest.snapshotContentDigest)
          )
        )
      )
    )
    return {
      destinationStaged: new DestinationStaged({
        sender: 'destination',
        transferId: args.transferId,
        manifestDigest: manifest.manifestDigest,
        snapshotContentDigest: manifest.snapshotContentDigest,
        stagingReceiptDigest,
      }),
    }
  }).pipe(Effect.tapError(() => args.channel.close().pipe(Effect.ignore)))
}

export const sendDestinationStaged = (
  channel: EncryptedProtocolChannel,
  message: DestinationStaged
): Effect.Effect<void, DeviceMigrationError> => channel.sendMessage(message)

export type SourceOutcome = SourceErased | SourceCancellationConfirmed

export function awaitSourceOutcome(
  channel: EncryptedProtocolChannel
): Effect.Effect<SourceOutcome, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const first = yield* _(channel.nextMessage())
    // The source durably commits retirement before erasing and announces that
    // commitment first. The authenticated erasure receipt that follows is the
    // authoritative outcome and is validated against the issued command by
    // the orchestration layer.
    const outcome: DeviceMigrationProtocolMessage =
      first._tag === 'EraseCommandAccepted'
        ? yield* _(channel.nextMessage())
        : first
    return outcome._tag === 'SourceErased' ||
      outcome._tag === 'SourceCancellationConfirmed'
      ? outcome
      : yield* _(Effect.fail(fail('stateInvalid')))
  })
}

export const sendDestinationReceiptStored = (
  channel: EncryptedProtocolChannel,
  message: DestinationReceiptStored
): Effect.Effect<void, DeviceMigrationError> => channel.sendMessage(message)

export const sendDestinationActivated = (
  channel: EncryptedProtocolChannel,
  message: DestinationActivated
): Effect.Effect<void, DeviceMigrationError> => channel.sendMessage(message)
