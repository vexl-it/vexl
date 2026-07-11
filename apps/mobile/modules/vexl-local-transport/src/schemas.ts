import {MigrationEndpointCandidate} from '@vexl-next/domain/src/general/deviceMigration/qrCodes'
import {Schema} from 'effect'

/**
 * Opaque identifier of one open native TCP connection. Only valid inside the
 * process that created it — never persist or transmit it.
 */
export const LocalTransportConnectionId = Schema.NonEmptyString.pipe(
  Schema.brand('LocalTransportConnectionId')
)
export type LocalTransportConnectionId = typeof LocalTransportConnectionId.Type

export const LocalTransportConnectionClosedReason = Schema.Literal(
  'closedByPeer',
  'error',
  'cancelled'
)
export type LocalTransportConnectionClosedReason =
  typeof LocalTransportConnectionClosedReason.Type

export const ConnectionAcceptedEvent = Schema.Struct({
  connectionId: LocalTransportConnectionId,
  remoteHost: Schema.String,
})
export type ConnectionAcceptedEvent = typeof ConnectionAcceptedEvent.Type

export const DataEvent = Schema.Struct({
  connectionId: LocalTransportConnectionId,
  /** Standard base64 (with padding) of one received chunk (max 64 KiB raw). */
  dataBase64: Schema.String,
})
export type DataEvent = typeof DataEvent.Type

export const ConnectionClosedEvent = Schema.Struct({
  connectionId: LocalTransportConnectionId,
  reason: LocalTransportConnectionClosedReason,
})
export type ConnectionClosedEvent = typeof ConnectionClosedEvent.Type

export const ListenerFailedEvent = Schema.Struct({
  reason: Schema.String,
})
export type ListenerFailedEvent = typeof ListenerFailedEvent.Type

export const StartListenerResult = Schema.Struct({
  port: Schema.Number.pipe(Schema.int(), Schema.between(1, 65535)),
})
export type StartListenerResult = typeof StartListenerResult.Type

export const ConnectResult = Schema.Struct({
  connectionId: LocalTransportConnectionId,
})
export type ConnectResult = typeof ConnectResult.Type

/**
 * Non-loopback IPv4 interface addresses plus the active listener port. Shares
 * the schema the pairing QR embeds. Local endpoint data is sensitive
 * migration metadata — display/use it only in memory and never report it.
 */
export const LocalEndpointCandidates = Schema.Array(MigrationEndpointCandidate)
export type LocalEndpointCandidates = typeof LocalEndpointCandidates.Type
