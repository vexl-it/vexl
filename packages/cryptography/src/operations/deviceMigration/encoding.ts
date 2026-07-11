/**
 * Internal byte-encoding helpers shared by the device-migration crypto
 * operations. Every value that enters a hash or MAC input is length-prefixed
 * with a 4-byte big-endian length so that field boundaries are unambiguous
 * (no concatenation-ambiguity attacks).
 */

/**
 * Encodes a string as UTF-8 bytes.
 *
 * Uses Buffer instead of sodium.from_string because from_string is unreliable
 * in react-native-libsodium (see cryptobox.ts). The bytes are copied into a
 * fresh Uint8Array so callers never observe Buffer's shared allocation pool.
 */
export function utf8Bytes(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'utf-8'))
}

/**
 * Encodes a non-negative integer (< 2^32) as 4 big-endian bytes.
 */
export function encodeUint32Be(value: number): Uint8Array {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError(
      'encodeUint32Be expects a non-negative integer smaller than 2^32'
    )
  }
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value, false)
  return bytes
}

/**
 * Reads 4 bytes at the given offset as a big-endian unsigned integer.
 * Respects the view's byteOffset, so it is safe on subarrays and Buffers.
 */
export function readUint32Be(bytes: Uint8Array, offset: number = 0): number {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getUint32(offset, false)
}

/**
 * Concatenates byte chunks into one freshly allocated Uint8Array.
 */
export function concatBytes(...chunks: readonly Uint8Array[]): Uint8Array {
  let total = 0
  for (const chunk of chunks) total += chunk.byteLength

  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

/**
 * Prefixes the given bytes with their 4-byte big-endian length.
 */
export function lengthPrefixed(bytes: Uint8Array): Uint8Array {
  return concatBytes(encodeUint32Be(bytes.byteLength), bytes)
}
