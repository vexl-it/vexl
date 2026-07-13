import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect} from 'effect'
import {Base64} from 'js-base64'
import {
  VexlLocalTransport,
  type Unsubscribe,
} from '../../../../modules/vexl-local-transport'
import {type LocalTransportConnectionId} from '../../../../modules/vexl-local-transport/src/schemas'
import {
  DEFAULT_PROTOCOL_TIMEOUTS,
  IncrementalFrameDecoder,
  MAX_WIRE_FRAME_BYTES,
  encodeLengthPrefixedFrame,
} from './framing'

export interface TransportChannel {
  readonly send: (
    bytes: Uint8Array
  ) => Effect.Effect<void, DeviceMigrationError>
  readonly nextFrame: (
    inactivityTimeoutMs?: number
  ) => Effect.Effect<Uint8Array, DeviceMigrationError>
  readonly close: () => Effect.Effect<void, DeviceMigrationError>
  readonly isClosed: () => boolean
}

interface PendingRead {
  readonly resolve: (frame: Uint8Array) => void
  readonly reject: (error: DeviceMigrationError) => void
  readonly timeout: ReturnType<typeof setTimeout>
}

class ChannelInbox {
  readonly #frames: Uint8Array[] = []
  #reads: PendingRead[] = []
  #closed = false
  #closeError = new DeviceMigrationError({code: 'transportFailed'})

  offer(frame: Uint8Array): void {
    if (this.#closed) return
    const read = this.#reads.shift()
    if (read !== undefined) {
      clearTimeout(read.timeout)
      read.resolve(frame)
    } else this.#frames.push(frame)
  }

  take(timeoutMs: number): Promise<Uint8Array> {
    const frame = this.#frames.shift()
    if (frame !== undefined) return Promise.resolve(frame)
    if (this.#closed) return Promise.reject(this.#closeError)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.#reads.findIndex((read) => read.timeout === timeout)
        if (index >= 0) this.#reads.splice(index, 1)
        reject(new DeviceMigrationError({code: 'timedOut'}))
      }, timeoutMs)
      this.#reads.push({resolve, reject, timeout})
    })
  }

  close(error = new DeviceMigrationError({code: 'transportFailed'})): void {
    if (this.#closed) return
    this.#closed = true
    this.#closeError = error
    for (const read of this.#reads) {
      clearTimeout(read.timeout)
      read.reject(error)
    }
    this.#reads = []
  }

  isClosed(): boolean {
    return this.#closed
  }
}

function makeChannel(args: {
  readonly sendFrame: (frame: Uint8Array) => Promise<void>
  readonly closeTransport: () => Promise<void>
  readonly inbox: ChannelInbox
  readonly connectedAt: number
  readonly now: () => number
}): TransportChannel {
  const durationError = (): DeviceMigrationError | undefined =>
    args.now() - args.connectedAt >
    DEFAULT_PROTOCOL_TIMEOUTS.maximumConnectedDurationMs
      ? new DeviceMigrationError({code: 'timedOut'})
      : undefined
  return {
    send: (bytes) =>
      Effect.tryPromise({
        try: async () => {
          const error = durationError()
          if (error !== undefined) throw error
          if (bytes.length > MAX_WIRE_FRAME_BYTES)
            throw new DeviceMigrationError({code: 'limitExceeded'})
          await args.sendFrame(encodeLengthPrefixedFrame(bytes))
        },
        catch: (error) =>
          error instanceof DeviceMigrationError
            ? error
            : new DeviceMigrationError({code: 'transportFailed'}),
      }),
    nextFrame: (timeoutMs = DEFAULT_PROTOCOL_TIMEOUTS.streamInactivityMs) =>
      Effect.tryPromise({
        try: async () => {
          const error = durationError()
          if (error !== undefined) throw error
          return await args.inbox.take(timeoutMs)
        },
        catch: (error) =>
          error instanceof DeviceMigrationError
            ? error
            : new DeviceMigrationError({code: 'transportFailed'}),
      }),
    close: () =>
      Effect.tryPromise({
        try: async () => {
          args.inbox.close()
          await args.closeTransport()
        },
        catch: () => new DeviceMigrationError({code: 'transportFailed'}),
      }),
    isClosed: () => args.inbox.isClosed(),
  }
}

export interface InMemoryChannelPair {
  readonly first: TransportChannel
  readonly second: TransportChannel
}

export function createInMemoryChannelPair(options?: {
  readonly now?: () => number
}): InMemoryChannelPair {
  const firstInbox = new ChannelInbox()
  const secondInbox = new ChannelInbox()
  const now = options?.now ?? Date.now
  const connectedAt = now()
  let closed = false
  const first = makeChannel({
    inbox: firstInbox,
    connectedAt,
    now,
    sendFrame: async (frame) => {
      if (closed) throw new DeviceMigrationError({code: 'transportFailed'})
      const decoder = new IncrementalFrameDecoder()
      for (const decoded of decoder.push(frame)) secondInbox.offer(decoded)
    },
    closeTransport: async () => {
      closed = true
      firstInbox.close()
      secondInbox.close()
    },
  })
  const second = makeChannel({
    inbox: secondInbox,
    connectedAt,
    now,
    sendFrame: async (frame) => {
      if (closed) throw new DeviceMigrationError({code: 'transportFailed'})
      const decoder = new IncrementalFrameDecoder()
      for (const decoded of decoder.push(frame)) firstInbox.offer(decoded)
    },
    closeTransport: async () => {
      closed = true
      secondInbox.close()
      firstInbox.close()
    },
  })
  return {first, second}
}

export function createNativeTransportChannel(args: {
  readonly connectionId: LocalTransportConnectionId
  readonly now?: () => number
}): TransportChannel {
  const inbox = new ChannelInbox()
  const decoder = new IncrementalFrameDecoder()
  const subscriptions: Unsubscribe[] = []
  let closed = false
  const fail = (error: DeviceMigrationError): void => {
    closed = true
    inbox.close(error)
  }
  subscriptions.push(
    VexlLocalTransport.addDataListener((event) => {
      if (event.connectionId !== args.connectionId) return
      try {
        for (const frame of decoder.push(Base64.toUint8Array(event.dataBase64)))
          inbox.offer(frame)
      } catch (error) {
        fail(
          error instanceof DeviceMigrationError
            ? error
            : new DeviceMigrationError({code: 'transportFailed'})
        )
      }
    }, fail),
    VexlLocalTransport.addConnectionClosedListener((event) => {
      if (event.connectionId === args.connectionId)
        fail(new DeviceMigrationError({code: 'transportFailed'}))
    }, fail)
  )
  return makeChannel({
    inbox,
    connectedAt: (args.now ?? Date.now)(),
    now: args.now ?? Date.now,
    sendFrame: async (frame) => {
      if (closed) throw new DeviceMigrationError({code: 'transportFailed'})
      await VexlLocalTransport.send(
        args.connectionId,
        Base64.fromUint8Array(frame)
      )
    },
    closeTransport: async () => {
      if (closed) return
      closed = true
      for (const unsubscribe of subscriptions) unsubscribe()
      await VexlLocalTransport.closeConnection(args.connectionId)
    },
  })
}
