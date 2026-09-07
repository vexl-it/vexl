import {Context, Effect, Layer, type Stream} from 'effect'
import {type WebSocket} from 'ws'
import {
  createConnectionsStream,
  createWebSocketServer,
  type ServerSocketError,
} from './utils'

export class IncommingConnectionsStreamContext extends Context.Service<
  IncommingConnectionsStreamContext,
  Stream.Stream<WebSocket, ServerSocketError, never>
>()('IncommingConnectionsStreamContext') {
  static readonly Live = Layer.effect(
    IncommingConnectionsStreamContext,
    createWebSocketServer.pipe(Effect.map(createConnectionsStream))
  )
}
