import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  DataChunk,
  type DestinationActivated,
  type DestinationReceiptStored,
  type DestinationStaged,
  type DeviceMigrationProtocolMessage,
  EntryEnd,
  type EraseCommandAccepted,
  FileEnd,
  FileStart,
  MmkvEntryStart,
  SnapshotEnd,
  SnapshotManifestMessage,
  type SourceCancellationConfirmed,
  type SourceErased,
} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {Effect, Option} from 'effect'
import {Base64} from 'js-base64'
import {
  type SnapshotExport,
  type SnapshotExportRecord,
} from '../snapshot/exporter'
import {
  type EncryptedProtocolChannel,
  MAX_ENCRYPTED_DATA_CHUNK_BYTES,
} from './encryptedChannel'

const fail = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

function expectMessage<A extends DeviceMigrationProtocolMessage>(
  channel: EncryptedProtocolChannel,
  predicate: (message: DeviceMigrationProtocolMessage) => message is A
): Effect.Effect<A, DeviceMigrationError> {
  return channel
    .nextMessage()
    .pipe(
      Effect.flatMap((message) =>
        predicate(message)
          ? Effect.succeed(message)
          : Effect.fail(fail('stateInvalid'))
      )
    )
}

function sendDataBytes(
  channel: EncryptedProtocolChannel,
  bytes: Uint8Array,
  sequence: {value: number}
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    for (
      let offset = 0;
      offset < bytes.length;
      offset += MAX_ENCRYPTED_DATA_CHUNK_BYTES
    ) {
      const chunk = bytes.subarray(
        offset,
        Math.min(offset + MAX_ENCRYPTED_DATA_CHUNK_BYTES, bytes.length)
      )
      yield* _(
        channel.sendMessage(
          new DataChunk({
            sender: 'source',
            sequenceNumber: sequence.value,
            payload: Base64.fromUint8Array(chunk),
          })
        )
      )
      sequence.value += 1
    }
  })
}

function sendExportRecord(
  channel: EncryptedProtocolChannel,
  record: SnapshotExportRecord,
  sequence: {value: number}
): Effect.Effect<void, DeviceMigrationError> {
  if (record.kind === 'dataChunk')
    return sendDataBytes(channel, record.bytes, sequence)
  if (record.kind === 'mmkvEntryStart')
    return channel.sendMessage(
      new MmkvEntryStart({
        sender: 'source',
        key: record.key,
        nativeType: record.nativeType,
        byteLength: record.byteLength,
      })
    )
  if (record.kind === 'mmkvEntryEnd')
    return channel.sendMessage(
      new EntryEnd({sender: 'source', key: record.key, sha256: record.sha256})
    )
  if (record.kind === 'fileStart')
    return channel.sendMessage(
      new FileStart({
        sender: 'source',
        path: record.path,
        byteLength: record.byteLength,
      })
    )
  if (record.kind === 'fileEnd')
    return channel.sendMessage(
      new FileEnd({sender: 'source', path: record.path, sha256: record.sha256})
    )
  if (record.kind === 'snapshotEnd')
    return channel.sendMessage(
      new SnapshotEnd({
        sender: 'source',
        manifestDigest: record.manifestDigest,
        snapshotContentDigest: record.snapshotContentDigest,
      })
    )
  // Session boundaries are implicit: after manifest.mmkvEntryCount entries,
  // exactly manifest.session.byteLength bytes of DataChunk payload follow.
  return Effect.void
}

export function serveSnapshot(
  channel: EncryptedProtocolChannel,
  snapshot: SnapshotExport
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    yield* _(
      channel.sendMessage(
        new SnapshotManifestMessage({
          sender: 'source',
          manifest: snapshot.manifest,
        })
      )
    )
    const sequence = {value: 0}
    for (;;) {
      const next = yield* _(snapshot.nextRecord())
      if (Option.isNone(next)) return
      yield* _(sendExportRecord(channel, next.value, sequence))
    }
  })
}

export function awaitDestinationStaged(
  channel: EncryptedProtocolChannel,
  expected: {
    readonly transferId: string
    readonly manifestDigest: string
    readonly snapshotContentDigest: string
  }
): Effect.Effect<DestinationStaged, DeviceMigrationError> {
  return expectMessage(
    channel,
    (message): message is DestinationStaged =>
      message._tag === 'DestinationStaged'
  ).pipe(
    Effect.flatMap((message) =>
      message.transferId === expected.transferId &&
      message.manifestDigest === expected.manifestDigest &&
      message.snapshotContentDigest === expected.snapshotContentDigest
        ? Effect.succeed(message)
        : Effect.fail(fail('digestMismatch'))
    )
  )
}

export const sendSourceCancellationConfirmed = (
  channel: EncryptedProtocolChannel,
  message: SourceCancellationConfirmed
): Effect.Effect<void, DeviceMigrationError> => channel.sendMessage(message)

export const sendEraseCommandAccepted = (
  channel: EncryptedProtocolChannel,
  message: EraseCommandAccepted
): Effect.Effect<void, DeviceMigrationError> => channel.sendMessage(message)

export const sendSourceErased = (
  channel: EncryptedProtocolChannel,
  message: SourceErased
): Effect.Effect<void, DeviceMigrationError> => channel.sendMessage(message)

export function awaitDestinationReceiptStored(
  channel: EncryptedProtocolChannel
): Effect.Effect<DestinationReceiptStored, DeviceMigrationError> {
  return expectMessage(
    channel,
    (message): message is DestinationReceiptStored =>
      message._tag === 'DestinationReceiptStored'
  )
}

export function awaitDestinationActivated(
  channel: EncryptedProtocolChannel
): Effect.Effect<DestinationActivated, DeviceMigrationError> {
  return expectMessage(
    channel,
    (message): message is DestinationActivated =>
      message._tag === 'DestinationActivated'
  )
}
