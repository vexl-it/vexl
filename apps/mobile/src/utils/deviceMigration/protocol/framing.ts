import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  HANDSHAKE_INACTIVITY_TIMEOUT_MS,
  MAX_CONNECTED_MIGRATION_DURATION_MS,
  MAX_CONTROL_FRAME_PLAINTEXT_BYTES,
  STREAM_INACTIVITY_TIMEOUT_MS,
} from '@vexl-next/domain/src/general/deviceMigration/limits'

/** Secretstream authentication bytes carried by each framed ciphertext. */
export const MAX_WIRE_FRAME_BYTES = MAX_CONTROL_FRAME_PLAINTEXT_BYTES + 17

export const DEFAULT_PROTOCOL_TIMEOUTS = {
  handshakeInactivityMs: HANDSHAKE_INACTIVITY_TIMEOUT_MS,
  streamInactivityMs: STREAM_INACTIVITY_TIMEOUT_MS,
  maximumConnectedDurationMs: MAX_CONNECTED_MIGRATION_DURATION_MS,
}

export interface FrameDecoderOptions {
  readonly maximumFrameBytes?: number
}

const frameError = (
  code: 'limitExceeded' | 'transportFailed'
): DeviceMigrationError => new DeviceMigrationError({code})

export function encodeLengthPrefixedFrame(bytes: Uint8Array): Uint8Array {
  if (bytes.length > 0xffffffff) throw frameError('limitExceeded')
  const result = new Uint8Array(4 + bytes.length)
  new DataView(result.buffer).setUint32(0, bytes.length, false)
  result.set(bytes, 4)
  return result
}

/**
 * Incremental byte-accurate frame decoder. The advertised length is checked
 * before a frame-sized output allocation is made.
 */
export class IncrementalFrameDecoder {
  readonly #maximumFrameBytes: number
  #chunks: Uint8Array[] = []
  #availableBytes = 0
  #expectedFrameBytes: number | undefined

  constructor(options: FrameDecoderOptions = {}) {
    this.#maximumFrameBytes = options.maximumFrameBytes ?? MAX_WIRE_FRAME_BYTES
  }

  push(chunk: Uint8Array): readonly Uint8Array[] {
    if (chunk.length > 0) {
      this.#chunks.push(chunk)
      this.#availableBytes += chunk.length
    }
    const frames: Uint8Array[] = []
    for (;;) {
      if (this.#expectedFrameBytes === undefined) {
        if (this.#availableBytes < 4) break
        const header = this.#readExact(4)
        const length = new DataView(
          header.buffer,
          header.byteOffset,
          header.byteLength
        ).getUint32(0, false)
        if (length > this.#maximumFrameBytes) throw frameError('limitExceeded')
        this.#expectedFrameBytes = length
      }
      if (this.#availableBytes < this.#expectedFrameBytes) break
      frames.push(this.#readExact(this.#expectedFrameBytes))
      this.#expectedFrameBytes = undefined
    }
    return frames
  }

  finish(): void {
    if (this.#availableBytes !== 0 || this.#expectedFrameBytes !== undefined)
      throw frameError('transportFailed')
  }

  #readExact(length: number): Uint8Array {
    const result = new Uint8Array(length)
    let written = 0
    while (written < length) {
      const first = this.#chunks[0]
      if (first === undefined) throw frameError('transportFailed')
      const take = Math.min(length - written, first.length)
      result.set(first.subarray(0, take), written)
      written += take
      this.#availableBytes -= take
      if (take === first.length) this.#chunks.shift()
      else this.#chunks[0] = first.subarray(take)
    }
    return result
  }
}
