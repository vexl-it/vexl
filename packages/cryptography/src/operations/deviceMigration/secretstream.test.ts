import sodium from 'libsodium-wrappers'
import {
  createDecryptStream,
  createEncryptStream,
  MAX_SECRETSTREAM_CHUNK_BYTES,
  SECRETSTREAM_FRAME_OVERHEAD_BYTES,
  SecretStreamChunkTooLargeError,
  SecretStreamCorruptedError,
  SecretStreamInvalidKeyError,
  SecretStreamStateError,
} from './secretstream'

async function generateKey(): Promise<Uint8Array> {
  await sodium.ready
  return sodium.crypto_secretstream_xchacha20poly1305_keygen()
}

function utf8(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'utf-8'))
}

function toString(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('utf-8')
}

describe('secretstream', () => {
  it('round-trips multi-chunk data with a final frame', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    const chunk1 = utf8('first chunk')
    const chunk2 = new Uint8Array(MAX_SECRETSTREAM_CHUNK_BYTES).fill(7)
    const chunk3 = utf8('final chunk')

    const c1 = encrypt.push(chunk1, false)
    const c2 = encrypt.push(chunk2, false)
    const c3 = encrypt.push(chunk3, true)

    const decrypt = await createDecryptStream(key, encrypt.header)

    const r1 = decrypt.pull(c1)
    expect(toString(r1.plaintext)).toBe('first chunk')
    expect(r1.isFinal).toBe(false)
    expect(decrypt.isFinished()).toBe(false)

    const r2 = decrypt.pull(c2)
    expect(Buffer.from(r2.plaintext).equals(Buffer.from(chunk2))).toBe(true)
    expect(r2.isFinal).toBe(false)

    const r3 = decrypt.pull(c3)
    expect(toString(r3.plaintext)).toBe('final chunk')
    expect(r3.isFinal).toBe(true)
    expect(decrypt.isFinished()).toBe(true)
  })

  it('supports an empty final frame', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    const c1 = encrypt.push(utf8('data'), false)
    const cFinal = encrypt.push(new Uint8Array(0), true)

    const decrypt = await createDecryptStream(key, encrypt.header)
    decrypt.pull(c1)
    const final = decrypt.pull(cFinal)

    expect(final.plaintext.length).toBe(0)
    expect(final.isFinal).toBe(true)
    expect(decrypt.isFinished()).toBe(true)
  })

  it('rejects a corrupted frame (bit flip) and poisons the stream', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    const c1 = encrypt.push(utf8('chunk one'), false)
    const c2 = encrypt.push(utf8('chunk two'), true)

    const corrupted = new Uint8Array(c1)
    const byte = corrupted[20]
    if (byte === undefined) throw new Error('unexpected short frame')
    corrupted[20] = byte ^ 0x01

    const decrypt = await createDecryptStream(key, encrypt.header)
    expect(() => decrypt.pull(corrupted)).toThrow(SecretStreamCorruptedError)
    // Poisoned: even the original valid frames must now fail.
    expect(() => decrypt.pull(c1)).toThrow(SecretStreamStateError)
    expect(() => decrypt.pull(c2)).toThrow(SecretStreamStateError)
  })

  it('detects truncation (stream ends without a final frame)', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    const c1 = encrypt.push(utf8('chunk one'), false)
    const c2 = encrypt.push(utf8('chunk two'), false)
    encrypt.push(utf8('final'), true)

    const decrypt = await createDecryptStream(key, encrypt.header)
    expect(decrypt.pull(c1).isFinal).toBe(false)
    expect(decrypt.pull(c2).isFinal).toBe(false)
    // The final frame never arrives — the receiver must detect this.
    expect(decrypt.isFinished()).toBe(false)
  })

  it('rejects reordered frames', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    encrypt.push(utf8('chunk one'), false)
    const c2 = encrypt.push(utf8('chunk two'), false)

    const decrypt = await createDecryptStream(key, encrypt.header)
    expect(() => decrypt.pull(c2)).toThrow(SecretStreamCorruptedError)
  })

  it('rejects duplicated frames', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    const c1 = encrypt.push(utf8('chunk one'), false)

    const decrypt = await createDecryptStream(key, encrypt.header)
    decrypt.pull(c1)
    expect(() => decrypt.pull(c1)).toThrow(SecretStreamCorruptedError)
  })

  it('rejects trailing frames after the final frame', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    const c1 = encrypt.push(utf8('chunk one'), false)
    const cFinal = encrypt.push(utf8('final'), true)

    const decrypt = await createDecryptStream(key, encrypt.header)
    decrypt.pull(c1)
    expect(decrypt.pull(cFinal).isFinal).toBe(true)
    expect(() => decrypt.pull(c1)).toThrow(SecretStreamStateError)
  })

  it('rejects decryption with a wrong key', async () => {
    const key = await generateKey()
    const wrongKey = await generateKey()
    const encrypt = await createEncryptStream(key)

    const c1 = encrypt.push(utf8('secret'), true)

    const decrypt = await createDecryptStream(wrongKey, encrypt.header)
    expect(() => decrypt.pull(c1)).toThrow(SecretStreamCorruptedError)
  })

  it('rejects pushing after the final frame', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    encrypt.push(utf8('final'), true)
    expect(() => encrypt.push(utf8('more'), false)).toThrow(
      SecretStreamStateError
    )
    expect(() => encrypt.push(utf8('more'), true)).toThrow(
      SecretStreamStateError
    )
  })

  it('enforces the 64 KiB plaintext chunk limit on push', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)

    expect(() =>
      encrypt.push(new Uint8Array(MAX_SECRETSTREAM_CHUNK_BYTES + 1), false)
    ).toThrow(SecretStreamChunkTooLargeError)

    // Exactly at the limit is allowed.
    const atLimit = encrypt.push(
      new Uint8Array(MAX_SECRETSTREAM_CHUNK_BYTES),
      false
    )
    expect(atLimit.length).toBe(
      MAX_SECRETSTREAM_CHUNK_BYTES + SECRETSTREAM_FRAME_OVERHEAD_BYTES
    )
  })

  it('enforces the chunk limit on pull before decrypting', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)
    const decrypt = await createDecryptStream(key, encrypt.header)

    const oversized = new Uint8Array(
      MAX_SECRETSTREAM_CHUNK_BYTES + SECRETSTREAM_FRAME_OVERHEAD_BYTES + 1
    )
    expect(() => decrypt.pull(oversized)).toThrow(
      SecretStreamChunkTooLargeError
    )
  })

  it('rejects frames shorter than the minimal frame size', async () => {
    const key = await generateKey()
    const encrypt = await createEncryptStream(key)
    const decrypt = await createDecryptStream(key, encrypt.header)

    expect(() =>
      decrypt.pull(new Uint8Array(SECRETSTREAM_FRAME_OVERHEAD_BYTES - 1))
    ).toThrow(SecretStreamCorruptedError)
  })

  it('rejects keys and headers of invalid length', async () => {
    const key = await generateKey()

    await expect(createEncryptStream(new Uint8Array(31))).rejects.toThrow(
      SecretStreamInvalidKeyError
    )
    await expect(
      createDecryptStream(new Uint8Array(31), new Uint8Array(24))
    ).rejects.toThrow(SecretStreamInvalidKeyError)
    await expect(createDecryptStream(key, new Uint8Array(23))).rejects.toThrow(
      SecretStreamInvalidKeyError
    )
  })
})
