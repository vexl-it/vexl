import sodium from 'libsodium-wrappers'

/**
 * Constant-time comparison of two byte arrays.
 *
 * - A length mismatch returns false immediately. Lengths of the compared
 *   values (digests, MACs, nonces) are public protocol constants, so leaking
 *   the length comparison is fine.
 * - When sodium.memcmp is available (wasm libsodium-wrappers after
 *   sodium.ready) it is used directly.
 * - Otherwise (react-native-libsodium does not expose memcmp, and wasm
 *   before sodium.ready) a branch-free XOR-fold over all bytes is used, so
 *   the comparison time does not depend on where the first difference is.
 *
 * Never use `===`/indexOf/etc. to compare secret-derived values such as
 * digests or MACs.
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  if (a.length === 0) return true

  if (typeof sodium.memcmp === 'function') {
    try {
      return sodium.memcmp(a, b)
    } catch {
      // Fall through to the XOR-fold implementation below.
    }
  }

  let difference = 0
  for (let i = 0; i < a.length; i++) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return difference === 0
}

/**
 * Constant-time comparison of two strings, compared as UTF-8 bytes.
 */
export function constantTimeEqualStrings(a: string, b: string): boolean {
  return constantTimeEqual(
    new Uint8Array(Buffer.from(a, 'utf-8')),
    new Uint8Array(Buffer.from(b, 'utf-8'))
  )
}
