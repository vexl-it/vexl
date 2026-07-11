/**
 * Pure byte-level helpers used for the deterministic, platform-independent
 * binary encodings of device migration (digest preimages and QR MAC
 * payloads). Implemented without TextEncoder/Buffer so the exact same bytes
 * are produced on Hermes, Node, and web runtimes.
 */

const UTF8_ONE_BYTE_MAX = 0x7f
const UTF8_TWO_BYTE_MAX = 0x7ff
const UTF8_THREE_BYTE_MAX = 0xffff
const HIGH_SURROGATE_START = 0xd800
const HIGH_SURROGATE_END = 0xdbff
const LOW_SURROGATE_START = 0xdc00
const LOW_SURROGATE_END = 0xdfff
const REPLACEMENT_CHARACTER = 0xfffd

export function utf8Encode(value: string): Uint8Array {
  const bytes: number[] = []
  for (let i = 0; i < value.length; i++) {
    let codePoint = value.charCodeAt(i)
    if (
      codePoint >= HIGH_SURROGATE_START &&
      codePoint <= HIGH_SURROGATE_END &&
      i + 1 < value.length
    ) {
      const next = value.charCodeAt(i + 1)
      if (next >= LOW_SURROGATE_START && next <= LOW_SURROGATE_END) {
        codePoint =
          0x10000 +
          ((codePoint - HIGH_SURROGATE_START) << 10) +
          (next - LOW_SURROGATE_START)
        i++
      }
    }
    if (codePoint >= HIGH_SURROGATE_START && codePoint <= LOW_SURROGATE_END) {
      // Lone surrogate. Mirrors the WHATWG TextEncoder replacement behavior
      // so the encoding stays deterministic for any javascript string.
      codePoint = REPLACEMENT_CHARACTER
    }
    if (codePoint <= UTF8_ONE_BYTE_MAX) {
      bytes.push(codePoint)
    } else if (codePoint <= UTF8_TWO_BYTE_MAX) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
    } else if (codePoint <= UTF8_THREE_BYTE_MAX) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      )
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      )
    }
  }
  return Uint8Array.from(bytes)
}

export function utf8ByteLength(value: string): number {
  return utf8Encode(value).length
}

export function concatBytes(...arrays: readonly Uint8Array[]): Uint8Array {
  let totalLength = 0
  for (const array of arrays) totalLength += array.length
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const array of arrays) {
    result.set(array, offset)
    offset += array.length
  }
  return result
}

const U32_MAX = 0xffffffff

export function u32be(value: number): Uint8Array {
  if (!Number.isInteger(value) || value < 0 || value > U32_MAX)
    throw new RangeError(
      'u32be requires a non-negative integer that fits into 4 bytes'
    )
  const result = new Uint8Array(4)
  new DataView(result.buffer).setUint32(0, value, false)
  return result
}

export function u64be(value: number): Uint8Array {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError('u64be requires a non-negative safe integer')
  const high = Math.floor(value / (U32_MAX + 1))
  const low = value % (U32_MAX + 1)
  return concatBytes(u32be(high), u32be(low))
}

export function lengthPrefixed(bytes: Uint8Array): Uint8Array {
  return concatBytes(u32be(bytes.length), bytes)
}

export function compareBytes(a: Uint8Array, b: Uint8Array): -1 | 0 | 1 {
  const commonLength = Math.min(a.length, b.length)
  for (let i = 0; i < commonLength; i++) {
    const aByte = a[i] ?? 0
    const bByte = b[i] ?? 0
    if (aByte !== bByte) return aByte < bByte ? -1 : 1
  }
  if (a.length === b.length) return 0
  return a.length < b.length ? -1 : 1
}

const HEX_STRING = /^[0-9a-f]*$/

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || !HEX_STRING.test(hex))
    throw new RangeError('Invalid lowercase hex string')
  const result = new Uint8Array(hex.length / 2)
  for (let i = 0; i < result.length; i++) {
    result[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return result
}

export function bytesToHex(bytes: Uint8Array): string {
  let result = ''
  for (const byte of bytes) {
    result += byte.toString(16).padStart(2, '0')
  }
  return result
}
