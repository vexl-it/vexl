import {Schema} from 'effect'
import {getCrypto} from '../../getCrypto'

/**
 * Error thrown when a streaming hash is used after digest() was called.
 */
export class Sha256StreamFinishedError extends Schema.TaggedError<Sha256StreamFinishedError>(
  'Sha256StreamFinishedError'
)('Sha256StreamFinishedError', {
  message: Schema.String,
}) {}

export interface Sha256Stream {
  update: (bytes: Uint8Array) => void
  digest: () => Uint8Array
}

/**
 * Creates a streaming SHA-256 hasher.
 *
 * Backed by getCrypto().createHash('sha256'): on device this resolves to the
 * native react-native-quick-crypto implementation (via merged-crypto), in
 * node/jest to node:crypto. Suitable for hashing large files chunk by chunk
 * without holding them in memory.
 */
export function createSha256(): Sha256Stream {
  const hash = getCrypto().createHash('sha256')
  let finished = false

  return {
    update: (bytes: Uint8Array): void => {
      if (finished) {
        throw new Sha256StreamFinishedError({
          message: 'update() called after digest()',
        })
      }
      hash.update(bytes)
    },
    digest: (): Uint8Array => {
      if (finished) {
        throw new Sha256StreamFinishedError({
          message: 'digest() called twice',
        })
      }
      finished = true
      // Copy into a fresh Uint8Array so callers never hold a Buffer from the
      // internal allocation pool.
      return new Uint8Array(hash.digest())
    },
  }
}

/**
 * One-shot SHA-256 over the given bytes. Returns the 32-byte digest.
 */
export function sha256Bytes(bytes: Uint8Array): Uint8Array {
  const stream = createSha256()
  stream.update(bytes)
  return stream.digest()
}
