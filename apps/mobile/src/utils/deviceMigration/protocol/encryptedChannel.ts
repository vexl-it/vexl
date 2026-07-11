import {
  createDecryptStream,
  createEncryptStream,
  SECRETSTREAM_HEADER_BYTES,
  type DecryptStream,
  type EncryptStream,
} from '@vexl-next/cryptography/src/operations/deviceMigration/secretstream'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {MAX_CONTROL_FRAME_PLAINTEXT_BYTES} from '@vexl-next/domain/src/general/deviceMigration/limits'
import {
  DeviceMigrationProtocolMessage,
  type DeviceMigrationProtocolMessage as ProtocolMessage,
} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {Effect, Either, Schema} from 'effect'
import {type TransportChannel} from './channel'

/**
 * Raw payload bytes that fit inside a JSON/base64 DataChunk while keeping
 * the entire secretstream plaintext below the 64 KiB control-frame limit.
 */
export const MAX_ENCRYPTED_DATA_CHUNK_BYTES = 48 * 1024

export interface EncryptedProtocolChannel {
  readonly sendMessage: (
    message: ProtocolMessage,
    final?: boolean
  ) => Effect.Effect<void, DeviceMigrationError>
  readonly nextMessage: () => Effect.Effect<
    ProtocolMessage,
    DeviceMigrationError
  >
  readonly peerFinished: () => boolean
  readonly close: () => Effect.Effect<void, DeviceMigrationError>
}

const error = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

function encodeMessage(
  message: ProtocolMessage
): Effect.Effect<Uint8Array, DeviceMigrationError> {
  return Effect.try({
    try: () => {
      const json = Schema.encodeSync(
        Schema.parseJson(DeviceMigrationProtocolMessage)
      )(message)
      const bytes = new TextEncoder().encode(json)
      if (bytes.length > MAX_CONTROL_FRAME_PLAINTEXT_BYTES)
        throw error('limitExceeded')
      return bytes
    },
    catch: (cause) =>
      cause instanceof DeviceMigrationError ? cause : error('schemaInvalid'),
  })
}

function decodeMessage(
  bytes: Uint8Array
): Effect.Effect<ProtocolMessage, DeviceMigrationError> {
  if (bytes.length > MAX_CONTROL_FRAME_PLAINTEXT_BYTES)
    return Effect.fail(error('limitExceeded'))
  return Effect.try({
    try: () => new TextDecoder().decode(bytes),
    catch: () => error('schemaInvalid'),
  }).pipe(
    Effect.flatMap((json) => {
      const decoded = Schema.decodeUnknownEither(
        Schema.parseJson(DeviceMigrationProtocolMessage)
      )(json)
      return Either.isRight(decoded)
        ? Effect.succeed(decoded.right)
        : Effect.fail(error('schemaInvalid'))
    })
  )
}

/**
 * Exchanges secretstream headers and upgrades the framed transport. Each
 * protocol message is exactly one authenticated push. Callers mark the last
 * message in each direction with `final: true`; a TCP close without a pulled
 * final tag is always treated as truncation.
 */
export function createEncryptedProtocolChannel(args: {
  readonly transport: TransportChannel
  readonly streamTxKey: Uint8Array
  readonly streamRxKey: Uint8Array
}): Effect.Effect<EncryptedProtocolChannel, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const encrypt = yield* _(
      Effect.tryPromise({
        try: async () => await createEncryptStream(args.streamTxKey),
        catch: () => error('transportFailed'),
      })
    )
    yield* _(args.transport.send(encrypt.header))
    const peerHeader = yield* _(args.transport.nextFrame())
    if (peerHeader.length !== SECRETSTREAM_HEADER_BYTES)
      return yield* _(Effect.fail(error('transportFailed')))
    const decrypt = yield* _(
      Effect.tryPromise({
        try: async () =>
          await createDecryptStream(args.streamRxKey, peerHeader),
        catch: () => error('transportFailed'),
      })
    )
    return makeEncryptedChannel(args.transport, encrypt, decrypt)
  })
}

function makeEncryptedChannel(
  transport: TransportChannel,
  encrypt: EncryptStream,
  decrypt: DecryptStream
): EncryptedProtocolChannel {
  let sentFinal = false
  return {
    sendMessage: (message, final = false) =>
      Effect.gen(function* (_) {
        if (sentFinal) return yield* _(Effect.fail(error('stateInvalid')))
        const plaintext = yield* _(encodeMessage(message))
        const ciphertext = yield* _(
          Effect.try({
            try: () => encrypt.push(plaintext, final),
            catch: () => error('transportFailed'),
          })
        )
        yield* _(transport.send(ciphertext))
        if (final) {
          // Calls are required to be sequential by the channel contract.
          // eslint-disable-next-line require-atomic-updates
          sentFinal = true
        }
      }),
    nextMessage: () =>
      transport.nextFrame().pipe(
        Effect.catchAll((transportError) =>
          decrypt.isFinished()
            ? Effect.fail(transportError)
            : Effect.fail(error('transportFailed'))
        ),
        Effect.flatMap((ciphertext) =>
          Effect.try({
            try: () => decrypt.pull(ciphertext).plaintext,
            catch: () => error('transportFailed'),
          })
        ),
        Effect.flatMap(decodeMessage)
      ),
    peerFinished: decrypt.isFinished,
    close: () => {
      if (!decrypt.isFinished())
        return transport
          .close()
          .pipe(Effect.flatMap(() => Effect.fail(error('transportFailed'))))
      return transport.close()
    },
  }
}
