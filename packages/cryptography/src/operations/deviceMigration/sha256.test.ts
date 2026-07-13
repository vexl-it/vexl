import {createSha256, sha256Bytes, Sha256StreamFinishedError} from './sha256'

function utf8(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'utf-8'))
}

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex')
}

describe('sha256', () => {
  it('matches the known "abc" test vector', () => {
    expect(bytesToHex(sha256Bytes(utf8('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })

  it('matches the known empty-input test vector', () => {
    expect(bytesToHex(sha256Bytes(new Uint8Array(0)))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    )
  })

  it('streaming digest matches one-shot digest regardless of chunking', () => {
    const data = new Uint8Array(100_000)
    for (let i = 0; i < data.length; i++) data[i] = i % 251

    const oneShot = bytesToHex(sha256Bytes(data))

    const stream = createSha256()
    stream.update(data.subarray(0, 1))
    stream.update(data.subarray(1, 4096))
    stream.update(data.subarray(4096, 4096))
    stream.update(data.subarray(4096))
    expect(bytesToHex(stream.digest())).toBe(oneShot)
  })

  it('streaming with a single update matches one-shot', () => {
    const stream = createSha256()
    stream.update(utf8('abc'))
    expect(bytesToHex(stream.digest())).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })

  it('returns a 32-byte digest', () => {
    expect(sha256Bytes(utf8('anything')).length).toBe(32)
  })

  it('throws when update is called after digest', () => {
    const stream = createSha256()
    stream.update(utf8('abc'))
    stream.digest()

    expect(() => {
      stream.update(utf8('more'))
    }).toThrow(Sha256StreamFinishedError)
  })

  it('throws when digest is called twice', () => {
    const stream = createSha256()
    stream.update(utf8('abc'))
    stream.digest()

    expect(() => stream.digest()).toThrow(Sha256StreamFinishedError)
  })
})
