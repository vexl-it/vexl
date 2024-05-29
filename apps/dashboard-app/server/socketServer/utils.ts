import {Chunk, Data, Effect, Option, Stream} from 'effect'
import {WebSocketServer, type RawData, type WebSocket} from 'ws'
import {socketServerPortConfig} from '../configs'

export const silentCloseServer = (
  ws: WebSocketServer
): Effect.Effect<void, never, never> =>
  Effect.async((cb) => {
    ws.clients.forEach((client) => {
      client.close()
    })

    ws.close(() => {
      cb(Effect.void)
    })
  }).pipe(Effect.andThen(() => Effect.log('Server socket closed')))

export const createWebSocketServer = Effect.acquireRelease(
  socketServerPortConfig.pipe(
    Effect.flatMap((port) => Effect.sync(() => new WebSocketServer({port})))
  ),
  silentCloseServer
)

export class ServerSocketError extends Data.TaggedError('ServerSocketError')<{
  originalError: Error
}> {}

export function createConnectionsStream(
  wss: WebSocketServer
): Stream.Stream<WebSocket, ServerSocketError, never> {
  return Stream.async<WebSocket, ServerSocketError>((emit) => {
    wss.on('connection', (ws: WebSocket) => {
      void emit(Effect.succeed(Chunk.of(ws)))
    })
    wss.on('error', (err) => {
      void emit(
        Effect.zipLeft(
          Effect.fail(Option.some(new ServerSocketError({originalError: err}))),
          Effect.logWarning('Websocket failed', err)
        )
      )
    })
    wss.on('close', (ws: WebSocket) => {
      void emit(
        Effect.zipLeft(
          Effect.fail(Option.none()),
          Effect.log('Websocket closed')
        )
      )
    })
  })
}

export class ReadingDataError extends Data.TaggedError('ReadingDataError')<{
  originalError: unknown
}> {}

export function dataToString(
  data: RawData
): Effect.Effect<string, ReadingDataError> {
  return Effect.try({
    try: () => {
      if (data instanceof Buffer) {
        return data.toString()
      }
      if (data instanceof ArrayBuffer) {
        return Buffer.from(data).toString()
      }
      if (Array.isArray(data)) {
        return data.map((data) => dataToString(data)).join('')
      }
      throw new Error('Unable to read data')
    },
    catch: (err: unknown) => new ReadingDataError({originalError: err}),
  })
}

export class MessageStreamError extends Data.TaggedError('MessageStreamError')<{
  originalError: Error
}> {}

export function createMessagesStream(
  ws: WebSocket
): Stream.Stream<RawData, MessageStreamError | ReadingDataError> {
  return Stream.async((emit) => {
    ws.on('message', (data) => {
      void emit(Effect.succeed(Chunk.of(data)))
    })

    ws.on('error', (err) => {
      void emit(
        Effect.fail(Option.some(new MessageStreamError({originalError: err})))
      )
    })

    ws.on('close', () => {
      void emit(Effect.fail(Option.none()))
    })
  })
}

export class SendingMessageError extends Data.Error<{
  originalError: unknown
}> {}

export function sendMessageToSocket(
  socket: WebSocket
): (message: string) => Effect.Effect<void, SendingMessageError> {
  return (message) =>
    Effect.async((emit) => {
      socket.send(message, (err) => {
        if (err) {
          emit(Effect.fail(new SendingMessageError({originalError: err})))
          return
        }
        emit(Effect.void)
      })
    })
}
