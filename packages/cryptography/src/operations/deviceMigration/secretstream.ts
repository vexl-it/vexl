import {Schema} from 'effect'
import sodium from 'libsodium-wrappers'

/**
 * Wrappers around sodium.crypto_secretstream_xchacha20poly1305_* used for the
 * encrypted device-migration transfer stream.
 *
 * Security properties provided by the underlying construction:
 * - each frame is authenticated (Poly1305) and encrypted (XChaCha20);
 * - frames are ordered by an internal ratcheting nonce, so reordering,
 *   duplication, or dropping a frame makes the next pull fail;
 * - the TAG_FINAL frame authenticates the end of the stream, so truncation
 *   is detectable (the receiver must check that the last pulled frame had
 *   isFinal === true — see isFinished()).
 *
 * Defense-in-depth added by this wrapper:
 * - a maximum plaintext chunk size of 64 KiB is enforced on both sides
 *   (matching the transport limits in docs/device-migration-spec.md), so a
 *   hostile peer cannot force large allocations;
 * - after any authentication failure the decrypt stream is poisoned and every
 *   subsequent pull fails (the wasm implementation returns `false` on failure
 *   but leaves the state usable — resuming after an auth failure would be
 *   unsafe);
 * - frames after the final frame are rejected;
 * - only TAG_MESSAGE and TAG_FINAL frames are accepted (TAG_PUSH/TAG_REKEY
 *   are not part of the migration protocol).
 */

/** Maximum plaintext bytes in one secretstream chunk (spec transport limit). */
export const MAX_SECRETSTREAM_CHUNK_BYTES = 64 * 1024

export const SECRETSTREAM_KEY_BYTES = 32
export const SECRETSTREAM_HEADER_BYTES = 24
/** Per-frame authentication overhead (tag byte + Poly1305 MAC). */
export const SECRETSTREAM_FRAME_OVERHEAD_BYTES = 17

/**
 * Error thrown when a stream is created with a key or header of invalid size.
 */
export class SecretStreamInvalidKeyError extends Schema.TaggedError<SecretStreamInvalidKeyError>(
  'SecretStreamInvalidKeyError'
)('SecretStreamInvalidKeyError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Error thrown when a plaintext or ciphertext chunk exceeds the 64 KiB limit.
 */
export class SecretStreamChunkTooLargeError extends Schema.TaggedError<SecretStreamChunkTooLargeError>(
  'SecretStreamChunkTooLargeError'
)('SecretStreamChunkTooLargeError', {
  message: Schema.String,
}) {}

/**
 * Error thrown when a ciphertext fails authentication: corruption, wrong key,
 * reordered/duplicated/dropped frames, truncated frames, or unsupported tags.
 */
export class SecretStreamCorruptedError extends Schema.TaggedError<SecretStreamCorruptedError>(
  'SecretStreamCorruptedError'
)('SecretStreamCorruptedError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Error thrown when a stream is used in an invalid state: pushing/pulling
 * after the final frame, or pulling on a poisoned (previously failed) stream.
 */
export class SecretStreamStateError extends Schema.TaggedError<SecretStreamStateError>(
  'SecretStreamStateError'
)('SecretStreamStateError', {
  message: Schema.String,
}) {}

export interface EncryptStream {
  /** Header bytes the receiving side needs to initialize its decrypt stream. */
  header: Uint8Array
  /**
   * Encrypts one plaintext chunk (max 64 KiB) into an authenticated
   * ciphertext frame. `isFinal: true` closes the stream; further pushes fail.
   */
  push: (plaintext: Uint8Array, isFinal: boolean) => Uint8Array
}

export interface DecryptStreamPullResult {
  plaintext: Uint8Array
  isFinal: boolean
}

export interface DecryptStream {
  /**
   * Authenticates and decrypts the next ciphertext frame. Frames must be
   * supplied in the exact order they were pushed.
   */
  pull: (ciphertext: Uint8Array) => DecryptStreamPullResult
  /**
   * True once the final frame was pulled. If the peer stream ends without
   * this being true the transfer was truncated and must be rejected.
   */
  isFinished: () => boolean
}

function validateKey(key: Uint8Array): void {
  if (key.length !== SECRETSTREAM_KEY_BYTES) {
    throw new SecretStreamInvalidKeyError({
      message: `Secretstream key must be ${SECRETSTREAM_KEY_BYTES} bytes`,
    })
  }
}

/**
 * Creates the sending side of an encrypted stream.
 */
export async function createEncryptStream(
  key: Uint8Array
): Promise<EncryptStream> {
  await sodium.ready
  validateKey(key)

  let initResult
  try {
    initResult = sodium.crypto_secretstream_xchacha20poly1305_init_push(key)
  } catch (cause) {
    throw new SecretStreamInvalidKeyError({
      message: 'Failed to initialize secretstream encryption',
      cause,
    })
  }
  const {state, header} = initResult
  let finished = false

  return {
    header,
    push: (plaintext: Uint8Array, isFinal: boolean): Uint8Array => {
      if (finished) {
        throw new SecretStreamStateError({
          message: 'push() called after the final frame was pushed',
        })
      }
      if (plaintext.length > MAX_SECRETSTREAM_CHUNK_BYTES) {
        throw new SecretStreamChunkTooLargeError({
          message: `Plaintext chunk exceeds ${MAX_SECRETSTREAM_CHUNK_BYTES} bytes`,
        })
      }

      try {
        const ciphertext = sodium.crypto_secretstream_xchacha20poly1305_push(
          state,
          plaintext,
          null,
          isFinal
            ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
            : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
        )
        if (isFinal) finished = true
        return ciphertext
      } catch (cause) {
        throw new SecretStreamCorruptedError({
          message: 'Secretstream encryption failed',
          cause,
        })
      }
    },
  }
}

/**
 * Creates the receiving side of an encrypted stream from the sender's header.
 */
export async function createDecryptStream(
  key: Uint8Array,
  header: Uint8Array
): Promise<DecryptStream> {
  await sodium.ready
  validateKey(key)
  if (header.length !== SECRETSTREAM_HEADER_BYTES) {
    throw new SecretStreamInvalidKeyError({
      message: `Secretstream header must be ${SECRETSTREAM_HEADER_BYTES} bytes`,
    })
  }

  let state
  try {
    state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(header, key)
  } catch (cause) {
    throw new SecretStreamInvalidKeyError({
      message: 'Failed to initialize secretstream decryption',
      cause,
    })
  }

  let finished = false
  let poisoned = false

  return {
    isFinished: () => finished,
    pull: (ciphertext: Uint8Array): DecryptStreamPullResult => {
      if (poisoned) {
        throw new SecretStreamStateError({
          message:
            'pull() called on a poisoned stream (a previous frame failed authentication)',
        })
      }
      if (finished) {
        poisoned = true
        throw new SecretStreamStateError({
          message: 'pull() called after the final frame (trailing frames)',
        })
      }
      if (ciphertext.length < SECRETSTREAM_FRAME_OVERHEAD_BYTES) {
        poisoned = true
        throw new SecretStreamCorruptedError({
          message: 'Ciphertext frame is shorter than the minimal frame size',
        })
      }
      if (
        ciphertext.length >
        MAX_SECRETSTREAM_CHUNK_BYTES + SECRETSTREAM_FRAME_OVERHEAD_BYTES
      ) {
        poisoned = true
        throw new SecretStreamChunkTooLargeError({
          message: `Ciphertext frame exceeds the ${MAX_SECRETSTREAM_CHUNK_BYTES} byte plaintext limit`,
        })
      }

      // The wasm implementation returns `false` on authentication failure
      // instead of throwing; the native binding may throw. Handle both and
      // poison the stream either way.
      let result: {message: Uint8Array; tag: number} | false | null | undefined
      try {
        result = sodium.crypto_secretstream_xchacha20poly1305_pull(
          state,
          ciphertext,
          null
        )
      } catch (cause) {
        poisoned = true
        throw new SecretStreamCorruptedError({
          message:
            'Secretstream frame failed authentication (corrupted, reordered, duplicated, or wrong key)',
          cause,
        })
      }

      if (typeof result !== 'object' || result === null) {
        poisoned = true
        throw new SecretStreamCorruptedError({
          message:
            'Secretstream frame failed authentication (corrupted, reordered, duplicated, or wrong key)',
        })
      }

      if (
        result.tag === sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      ) {
        finished = true
        return {plaintext: result.message, isFinal: true}
      }
      if (
        result.tag === sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
      ) {
        return {plaintext: result.message, isFinal: false}
      }

      // TAG_PUSH / TAG_REKEY are not part of the migration protocol.
      poisoned = true
      throw new SecretStreamCorruptedError({
        message: 'Secretstream frame carries an unsupported tag',
      })
    },
  }
}
