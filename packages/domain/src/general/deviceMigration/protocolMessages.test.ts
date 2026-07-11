import {Either, Schema} from 'effect'
import {Base64} from 'js-base64'
import {MAX_DATA_CHUNK_PLAINTEXT_BYTES} from './limits'
import {
  ClientHello,
  DataChunk,
  DestinationStaged,
  DeviceMigrationProtocolMessage,
} from './protocolMessages'
import {
  makeTestManifestInput,
  testManifestDigest,
  testSnapshotContentDigest,
  testStagingReceiptDigest,
} from './testFixtures'

const decodeMessage = Schema.decodeUnknownEither(DeviceMigrationProtocolMessage)

const clientHelloInput = {
  _tag: 'ClientHello',
  sender: 'destination',
  version: {
    appVersion: '1.44.2',
    migrationProtocolVersion: 1,
    snapshotStorageSchemaVersion: 1,
  },
  transferId: 'T'.repeat(43),
  keyExchangePublicKey: Base64.fromUint8Array(new Uint8Array(32).fill(7)),
}

describe('DeviceMigrationProtocolMessage union', () => {
  it('decodes every message type through the union', () => {
    const result = decodeMessage(clientHelloInput)
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('ClientHello')
      expect(result.right instanceof ClientHello).toBe(true)
    }

    expect(
      Either.isRight(
        decodeMessage({
          _tag: 'SnapshotManifest',
          sender: 'source',
          manifest: makeTestManifestInput(),
        })
      )
    ).toBe(true)
    expect(
      Either.isRight(
        decodeMessage({
          _tag: 'MmkvEntryStart',
          sender: 'source',
          key: 'messagingState',
          nativeType: 'string',
          byteLength: 42,
        })
      )
    ).toBe(true)
    expect(
      Either.isRight(
        decodeMessage({
          _tag: 'Close',
          sender: 'destination',
          reason: 'cancelled',
        })
      )
    ).toBe(true)
  })

  it('fails closed on unknown _tag values', () => {
    expect(
      Either.isLeft(decodeMessage({...clientHelloInput, _tag: 'EraseNow'}))
    ).toBe(true)
    expect(
      Either.isLeft(
        decodeMessage({_tag: 'SomeFutureMessage', sender: 'source'})
      )
    ).toBe(true)
    expect(Either.isLeft(decodeMessage({}))).toBe(true)
    expect(Either.isLeft(decodeMessage(null))).toBe(true)
    expect(Either.isLeft(decodeMessage('ClientHello'))).toBe(true)
  })

  it('enforces role binding on role-bound messages', () => {
    // ClientHello is destination-only
    expect(
      Either.isLeft(decodeMessage({...clientHelloInput, sender: 'source'}))
    ).toBe(true)
    // DestinationStaged is destination-only
    expect(
      Either.isLeft(
        decodeMessage({
          _tag: 'DestinationStaged',
          sender: 'source',
          transferId: 'T'.repeat(43),
          manifestDigest: testManifestDigest,
          snapshotContentDigest: testSnapshotContentDigest,
          stagingReceiptDigest: testStagingReceiptDigest,
        })
      )
    ).toBe(true)
    // SourceErased is source-only
    const sourceErasedInput = {
      _tag: 'SourceErased',
      sender: 'source',
      qrSchemaVersion: 1,
      version: {
        appVersion: '1.44.2',
        migrationProtocolVersion: 1,
        snapshotStorageSchemaVersion: 1,
      },
      transferId: 'T'.repeat(43),
      manifestDigest: testManifestDigest,
      snapshotContentDigest: testSnapshotContentDigest,
      acceptedEraseCommandDigest: '4'.repeat(64),
      acceptedEraseCommandNonce: 'C'.repeat(43),
      receiptNonce: 'R'.repeat(43),
      cleanupResultDigest: '5'.repeat(64),
      issuedAt: 1751000000000,
      mac: Base64.fromUint8Array(new Uint8Array(32).fill(8)),
    }
    expect(Either.isRight(decodeMessage(sourceErasedInput))).toBe(true)
    expect(
      Either.isLeft(
        decodeMessage({...sourceErasedInput, sender: 'destination'})
      )
    ).toBe(true)
  })

  it('rejects malformed payloads and missing fields', () => {
    expect(
      Either.isLeft(decodeMessage({...clientHelloInput, transferId: 'short'}))
    ).toBe(true)
    expect(
      Either.isLeft(
        decodeMessage({...clientHelloInput, keyExchangePublicKey: 'AAAA'})
      )
    ).toBe(true)
    const {transferId, ...withoutTransferId} = clientHelloInput
    expect(Either.isLeft(decodeMessage(withoutTransferId))).toBe(true)
  })
})

describe('DataChunk', () => {
  const chunkOf = (byteLength: number): unknown => ({
    _tag: 'DataChunk',
    sender: 'source',
    sequenceNumber: 0,
    payload: Base64.fromUint8Array(new Uint8Array(byteLength)),
  })

  it('enforces the 64 KiB plaintext limit at the boundary', () => {
    expect(
      Either.isRight(decodeMessage(chunkOf(MAX_DATA_CHUNK_PLAINTEXT_BYTES - 1)))
    ).toBe(true)
    expect(
      Either.isRight(decodeMessage(chunkOf(MAX_DATA_CHUNK_PLAINTEXT_BYTES)))
    ).toBe(true)
    expect(
      Either.isLeft(decodeMessage(chunkOf(MAX_DATA_CHUNK_PLAINTEXT_BYTES + 1)))
    ).toBe(true)
  })

  it('rejects non-base64 payloads and invalid sequence numbers', () => {
    expect(
      Either.isLeft(
        decodeMessage({
          _tag: 'DataChunk',
          sender: 'source',
          sequenceNumber: 0,
          payload: '!!not-base64!!',
        })
      )
    ).toBe(true)
    expect(
      Either.isLeft(
        decodeMessage({
          _tag: 'DataChunk',
          sender: 'source',
          sequenceNumber: -1,
          payload: 'AAAA',
        })
      )
    ).toBe(true)
    expect(
      Either.isLeft(
        decodeMessage({
          _tag: 'DataChunk',
          sender: 'source',
          sequenceNumber: 1.5,
          payload: 'AAAA',
        })
      )
    ).toBe(true)
  })

  it('round trips through encode', () => {
    const chunk = new DataChunk({
      sender: 'source',
      sequenceNumber: 7,
      payload: Base64.fromUint8Array(Uint8Array.of(1, 2, 3)),
    })
    const encoded = chunk.toData()
    const decoded = decodeMessage(encoded)
    expect(Either.isRight(decoded)).toBe(true)
    if (Either.isRight(decoded)) {
      expect(decoded.right.toData()).toEqual(chunk.toData())
      expect(decoded.right instanceof DataChunk).toBe(true)
    }
  })
})

describe('parseUnkownOption statics', () => {
  it('exist on message classes and fail closed', () => {
    expect(
      Either.isRight(
        decodeMessage({
          _tag: 'DestinationStaged',
          sender: 'destination',
          transferId: 'T'.repeat(43),
          manifestDigest: testManifestDigest,
          snapshotContentDigest: testSnapshotContentDigest,
          stagingReceiptDigest: testStagingReceiptDigest,
        })
      )
    ).toBe(true)
    expect(DestinationStaged.parseUnkownOption({})._tag).toBe('None')
  })
})
