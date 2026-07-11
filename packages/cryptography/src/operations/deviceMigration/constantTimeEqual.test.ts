import sodium from 'libsodium-wrappers'
import {constantTimeEqual, constantTimeEqualStrings} from './constantTimeEqual'

describe('constantTimeEqual', () => {
  it('returns true for identical byte arrays', () => {
    const a = new Uint8Array([1, 2, 3, 255, 0, 42])
    const b = new Uint8Array([1, 2, 3, 255, 0, 42])

    expect(constantTimeEqual(a, b)).toBe(true)
  })

  it('returns true for empty arrays', () => {
    expect(constantTimeEqual(new Uint8Array(0), new Uint8Array(0))).toBe(true)
  })

  it('returns false when a single byte differs', () => {
    const a = new Uint8Array(32).fill(7)

    for (const position of [0, 15, 31]) {
      const b = new Uint8Array(32).fill(7)
      b[position] = 8
      expect(constantTimeEqual(a, b)).toBe(false)
    }
  })

  it('returns false when only the highest bit differs', () => {
    const a = new Uint8Array([0x00])
    const b = new Uint8Array([0x80])

    expect(constantTimeEqual(a, b)).toBe(false)
  })

  it('returns false on length mismatch, including prefix relationships', () => {
    const a = new Uint8Array([1, 2, 3])

    expect(constantTimeEqual(a, new Uint8Array([1, 2]))).toBe(false)
    expect(constantTimeEqual(a, new Uint8Array([1, 2, 3, 4]))).toBe(false)
    expect(constantTimeEqual(a, new Uint8Array(0))).toBe(false)
  })

  it('behaves identically before and after sodium is ready', async () => {
    const a = new Uint8Array([9, 9, 9])
    const b = new Uint8Array([9, 9, 9])
    const c = new Uint8Array([9, 9, 8])

    // (sodium may or may not already be ready when this test runs — the
    // function must be correct either way.)
    expect(constantTimeEqual(a, b)).toBe(true)
    expect(constantTimeEqual(a, c)).toBe(false)

    await sodium.ready
    expect(constantTimeEqual(a, b)).toBe(true)
    expect(constantTimeEqual(a, c)).toBe(false)
  })
})

describe('constantTimeEqualStrings', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeEqualStrings('abc123', 'abc123')).toBe(true)
    expect(constantTimeEqualStrings('', '')).toBe(true)
  })

  it('returns false for different strings', () => {
    expect(constantTimeEqualStrings('abc123', 'abc124')).toBe(false)
    expect(constantTimeEqualStrings('abc', 'abcd')).toBe(false)
    expect(constantTimeEqualStrings('abc', '')).toBe(false)
  })

  it('compares unicode strings by UTF-8 bytes', () => {
    expect(
      constantTimeEqualStrings('příliš žluťoučký', 'příliš žluťoučký')
    ).toBe(true)
    expect(constantTimeEqualStrings('příliš', 'prilis')).toBe(false)
  })
})
