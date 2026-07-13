import {MAX_CONTROL_FRAME_PLAINTEXT_BYTES} from '@vexl-next/domain/src/general/deviceMigration/limits'
import {
  DataChunk,
  DeviceMigrationProtocolMessage,
} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {Schema} from 'effect'
import {Base64} from 'js-base64'
import {MAX_ENCRYPTED_DATA_CHUNK_BYTES} from './encryptedChannel'

describe('encrypted channel chunk sizing', () => {
  it('leaves room for the JSON envelope at the largest sequence number', () => {
    const message = new DataChunk({
      sender: 'source',
      sequenceNumber: Number.MAX_SAFE_INTEGER,
      payload: Base64.fromUint8Array(
        new Uint8Array(MAX_ENCRYPTED_DATA_CHUNK_BYTES)
      ),
    })
    const json = Schema.encodeSync(
      Schema.parseJson(DeviceMigrationProtocolMessage)
    )(message)

    expect(new TextEncoder().encode(json).length).toBeLessThanOrEqual(
      MAX_CONTROL_FRAME_PLAINTEXT_BYTES
    )
  })
})
