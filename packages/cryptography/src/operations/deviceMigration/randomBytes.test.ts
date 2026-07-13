import {
  generateRandomBase64Url,
  generateRandomBytes,
  MAX_RANDOM_BYTES,
  RandomBytesError,
} from './randomBytes'

describe('generateRandomBytes', () => {
  it('returns the requested number of bytes', async () => {
    expect((await generateRandomBytes(1)).length).toBe(1)
    expect((await generateRandomBytes(32)).length).toBe(32)
    expect((await generateRandomBytes(MAX_RANDOM_BYTES)).length).toBe(
      MAX_RANDOM_BYTES
    )
  })

  it('returns different values on every call', async () => {
    const a = await generateRandomBytes(32)
    const b = await generateRandomBytes(32)

    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false)
  })

  it('rejects invalid byte lengths', async () => {
    for (const byteLength of [0, -1, 1.5, Number.NaN, MAX_RANDOM_BYTES + 1]) {
      await expect(generateRandomBytes(byteLength)).rejects.toThrow(
        RandomBytesError
      )
    }
  })
})

describe('generateRandomBase64Url', () => {
  it('returns unpadded base64url that decodes back to the requested length', async () => {
    for (const byteLength of [1, 16, 32, 33]) {
      const value = await generateRandomBase64Url(byteLength)

      expect(value).toMatch(/^[A-Za-z0-9_-]+$/)
      expect(Buffer.from(value, 'base64url').length).toBe(byteLength)
    }
  })

  it('returns different values on every call', async () => {
    const a = await generateRandomBase64Url(32)
    const b = await generateRandomBase64Url(32)

    expect(a).not.toBe(b)
  })

  it('rejects invalid byte lengths', async () => {
    for (const byteLength of [0, -1, 1.5, Number.NaN, MAX_RANDOM_BYTES + 1]) {
      await expect(generateRandomBase64Url(byteLength)).rejects.toThrow(
        RandomBytesError
      )
    }
  })
})
