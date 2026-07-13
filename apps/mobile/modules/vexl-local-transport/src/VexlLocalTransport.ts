import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Either, Schema} from 'effect'
import {
  getVexlLocalTransportNativeModule,
  type VexlLocalTransportEventName,
} from './nativeModule'
import {
  ConnectionAcceptedEvent,
  ConnectionClosedEvent,
  ConnectResult,
  DataEvent,
  ListenerFailedEvent,
  LocalEndpointCandidates,
  StartListenerResult,
  type LocalTransportConnectionId,
} from './schemas'

export type Unsubscribe = () => void

/**
 * Decodes a value that crossed the native bridge. On failure a
 * `DeviceMigrationError` with an enumerated code is thrown instead of the
 * `ParseError` — a `ParseError` embeds the actual value (endpoints,
 * connection payloads) which must never leak into error reporting.
 */
const decodeBridgeValue = <A, I>(
  schema: Schema.Schema<A, I>
): ((value: unknown) => A) => {
  const decode = Schema.decodeUnknownEither(schema)
  return (value) => {
    const result = decode(value)
    if (Either.isLeft(result))
      throw new DeviceMigrationError({code: 'transportFailed'})
    return result.right
  }
}

const decodeStartListenerResult = decodeBridgeValue(StartListenerResult)
const decodeLocalEndpointCandidates = decodeBridgeValue(LocalEndpointCandidates)
const decodeConnectResult = decodeBridgeValue(ConnectResult)

// Belt-and-suspenders single-inbound-connection enforcement. The native side
// already refuses further accepts once one inbound connection was accepted
// (belt); this mirrors that rule in javascript (suspenders) so a misbehaving
// native layer still cannot surface a second peer to the protocol layer.
let acceptedInboundConnectionId: LocalTransportConnectionId | undefined
let refusedInboundConnectionIds = new Set<string>()

const resetInboundConnectionState = (): void => {
  acceptedInboundConnectionId = undefined
  refusedInboundConnectionIds = new Set()
}

const addDecodedNativeListener = <A, I>(
  eventName: VexlLocalTransportEventName,
  schema: Schema.Schema<A, I>,
  listener: (event: A) => void,
  onInvalidEvent?: (error: DeviceMigrationError) => void
): Unsubscribe => {
  const decode = Schema.decodeUnknownEither(schema)
  const subscription = getVexlLocalTransportNativeModule().addListener(
    eventName,
    (payload) => {
      const result = decode(payload)
      if (Either.isLeft(result)) {
        onInvalidEvent?.(new DeviceMigrationError({code: 'transportFailed'}))
        return
      }
      listener(result.right)
    }
  )
  return () => {
    subscription.remove()
  }
}

/**
 * Thin typed wrapper around the in-repository `VexlLocalTransport` Expo
 * module. Framing, transport limits, timeouts and the migration protocol
 * state machine deliberately live in the javascript protocol layer — this
 * wrapper only validates everything crossing the bridge and enforces the
 * single-inbound-connection rule.
 *
 * There is no TLS at this layer; the application-layer secretstream encrypts
 * every byte. Privacy: values handled here (hosts, ports, payload chunks) are
 * sensitive migration metadata and must never reach `reportError`, Sentry,
 * logs, or any Vexl request.
 */
export const VexlLocalTransport = {
  /**
   * Binds a TCP listener on an ephemeral port on all interfaces. At most one
   * listener is active at a time; starting a second one rejects.
   */
  startListener: async (): Promise<StartListenerResult> => {
    const result = await getVexlLocalTransportNativeModule().startListener()
    resetInboundConnectionState()
    return decodeStartListenerResult(result)
  },

  /**
   * Non-loopback IPv4 interface addresses combined with the active listener
   * port. Rejects when no listener is active.
   */
  getLocalEndpointCandidates: async (): Promise<LocalEndpointCandidates> => {
    const result =
      await getVexlLocalTransportNativeModule().getLocalEndpointCandidates()
    return decodeLocalEndpointCandidates(result)
  },

  /**
   * Stops the active listener. Idempotent. Connections that were already
   * accepted stay open.
   */
  stopListener: async (): Promise<void> => {
    await getVexlLocalTransportNativeModule().stopListener()
  },

  /**
   * Opens an outbound TCP connection. Rejects when the connection cannot be
   * established within `timeoutMs`.
   */
  connect: async (
    host: string,
    port: number,
    timeoutMs: number
  ): Promise<ConnectResult> => {
    const result = await getVexlLocalTransportNativeModule().connect(
      host,
      port,
      timeoutMs
    )
    return decodeConnectResult(result)
  },

  /**
   * Sends one chunk (standard base64 with padding). Backpressure aware — the
   * promise resolves only after the native stack accepted the bytes.
   */
  send: async (
    connectionId: LocalTransportConnectionId,
    dataBase64: string
  ): Promise<void> => {
    await getVexlLocalTransportNativeModule().send(connectionId, dataBase64)
  },

  /** Closes a connection. Idempotent. */
  closeConnection: async (
    connectionId: LocalTransportConnectionId
  ): Promise<void> => {
    await getVexlLocalTransportNativeModule().closeConnection(connectionId)
  },

  /**
   * Inbound connection accepted by the listener. At most one inbound
   * connection is ever delivered per listener session — any additional one is
   * closed immediately and never surfaced.
   */
  addConnectionAcceptedListener: (
    listener: (event: ConnectionAcceptedEvent) => void,
    onInvalidEvent?: (error: DeviceMigrationError) => void
  ): Unsubscribe =>
    addDecodedNativeListener(
      'onConnectionAccepted',
      ConnectionAcceptedEvent,
      (event) => {
        if (
          acceptedInboundConnectionId !== undefined &&
          acceptedInboundConnectionId !== event.connectionId
        ) {
          refusedInboundConnectionIds.add(event.connectionId)
          void getVexlLocalTransportNativeModule()
            .closeConnection(event.connectionId)
            .catch(() => {
              // The refused connection is already gone — nothing to release.
            })
          return
        }
        acceptedInboundConnectionId = event.connectionId
        listener(event)
      },
      onInvalidEvent
    ),

  /** One received chunk (up to 64 KiB raw, base64 encoded). */
  addDataListener: (
    listener: (event: DataEvent) => void,
    onInvalidEvent?: (error: DeviceMigrationError) => void
  ): Unsubscribe =>
    addDecodedNativeListener(
      'onData',
      DataEvent,
      (event) => {
        if (refusedInboundConnectionIds.has(event.connectionId)) return
        listener(event)
      },
      onInvalidEvent
    ),

  addConnectionClosedListener: (
    listener: (event: ConnectionClosedEvent) => void,
    onInvalidEvent?: (error: DeviceMigrationError) => void
  ): Unsubscribe =>
    addDecodedNativeListener(
      'onConnectionClosed',
      ConnectionClosedEvent,
      (event) => {
        if (refusedInboundConnectionIds.has(event.connectionId)) return
        listener(event)
      },
      onInvalidEvent
    ),

  /** The active listener failed after it was successfully started. */
  addListenerFailedListener: (
    listener: (event: ListenerFailedEvent) => void,
    onInvalidEvent?: (error: DeviceMigrationError) => void
  ): Unsubscribe =>
    addDecodedNativeListener(
      'onListenerFailed',
      ListenerFailedEvent,
      listener,
      onInvalidEvent
    ),
}
