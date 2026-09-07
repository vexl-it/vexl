import {Data, Effect, Queue, Stream} from 'effect'
import {WebSocketServer, type RawData, type WebSocket} from 'ws'
import {socketServerPortConfig} from '../configs'

export const silentCloseServer = (
  ws: WebSocketServer
): Effect.Effect<void, never, never> =>
  Effect.callback((cb) => {
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
  return Stream.callback<WebSocket, ServerSocketError>(
    (queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const connection = (socket: WebSocket): void => {
            Effect.runFork(Queue.offer(queue, socket))
          }
          const error = (originalError: Error): void => {
            Effect.runFork(
              Queue.fail(queue, new ServerSocketError({originalError}))
            )
          }
          const close = (): void => {
            Queue.endUnsafe(queue)
          }
          wss.on('connection', connection)
          wss.on('error', error)
          wss.on('close', close)
          return () => {
            wss.off('connection', connection)
            wss.off('error', error)
            wss.off('close', close)
          }
        }),
        (cleanup) => Effect.sync(cleanup)
      ),
    {bufferSize: 16}
  )
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
  return Stream.callback<RawData, MessageStreamError>(
    (queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const message = (data: RawData): void => {
            Effect.runFork(Queue.offer(queue, data))
          }
          const error = (originalError: Error): void => {
            Effect.runFork(
              Queue.fail(queue, new MessageStreamError({originalError}))
            )
          }
          const close = (): void => {
            Queue.endUnsafe(queue)
          }
          ws.on('message', message)
          ws.on('error', error)
          ws.on('close', close)
          return () => {
            ws.off('message', message)
            ws.off('error', error)
            ws.off('close', close)
          }
        }),
        (cleanup) => Effect.sync(cleanup)
      ),
    {bufferSize: 16}
  )
}

export class SendingMessageError extends Data.Error<{
  originalError: unknown
}> {}

export function sendMessageToSocket(
  socket: WebSocket
): (message: string) => Effect.Effect<void, SendingMessageError> {
  return (message) =>
    Effect.callback((emit) => {
      socket.send(message, (err) => {
        if (err) {
          emit(Effect.fail(new SendingMessageError({originalError: err})))
          return
        }
        emit(Effect.void)
      })
    })
}
