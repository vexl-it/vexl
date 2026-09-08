// import {type ParseError} from 'effect/ParseResult'
import {
  Data,
  Effect,
  Queue,
  Schedule,
  Schema,
  Stream,
  pipe,
  type Scope,
} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {ServerMessage} from '../../common/ServerMessage'
import {ClientMessage, PingMessage} from './../../common/ClientMessage'

class SocketError extends Data.TaggedError('SocketError')<{
  originalError: unknown
}> {}

class SendingMessageError extends Data.TaggedError('SendingMessageError')<{
  originalError: unknown
}> {}

const encodeMessage = Schema.encodeEffect(Schema.fromJsonString(ClientMessage))

const sendMessageToSocket =
  (connection: WebSocket) => (message: ClientMessage) =>
    pipe(
      message,
      encodeMessage,
      Effect.flatMap((message: string) =>
        Effect.try({
          try: () => {
            connection.send(message)
          },
          catch: (err: unknown) =>
            new SendingMessageError({originalError: err}),
        })
      )
    )

interface SocketConnection {
  sendMessage: (
    message: ClientMessage
  ) => Effect.Effect<void, SchemaError | SendingMessageError, never>
  messagesStream: Stream.Stream<ServerMessage, SocketError, never>
}

const parseMessage = Schema.decodeUnknownEffect(
  Schema.fromJsonString(ServerMessage)
)

const createMessagesStream = (
  socket: WebSocket
): Stream.Stream<ServerMessage, SocketError> => {
  return Stream.callback<MessageEvent<unknown>, SocketError>(
    (queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const message = (event: MessageEvent<unknown>): void => {
            Effect.runFork(Queue.offer(queue, event))
          }
          const error = (originalError: Event): void => {
            Effect.runFork(Queue.fail(queue, new SocketError({originalError})))
          }
          const close = (): void => {
            Queue.endUnsafe(queue)
          }
          socket.addEventListener('message', message)
          socket.addEventListener('error', error)
          socket.addEventListener('close', close)
          return () => {
            socket.removeEventListener('message', message)
            socket.removeEventListener('error', error)
            socket.removeEventListener('close', close)
          }
        }),
        (cleanup) => Effect.sync(cleanup)
      ),
    {bufferSize: 16}
  ).pipe(
    Stream.mapEffect((v) => parseMessage(v.data)),
    Stream.catchTag('SchemaError', () =>
      Stream.fromEffect(
        Effect.andThen(
          Effect.logError('Error while parsing message'),
          Effect.succeed(null)
        )
      )
    ),
    Stream.filter((a): a is NonNullable<typeof a> => !!a)
  )
}

const runPingPong = (
  connection: SocketConnection
): Effect.Effect<void, never, never> =>
  pipe(
    connection.sendMessage(new PingMessage()),
    Effect.tapError((e) => Effect.logError('Error while sending ping', e)),
    Effect.ignore,
    Effect.repeat(Schedule.spaced('30 seconds')),
    Effect.ignore
  )

export const createAndConnectSocket = (
  url: string
): Effect.Effect<SocketConnection, SocketError, Scope.Scope> =>
  Effect.gen(function* () {
    const ws = new WebSocket(url)
    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        ws.close()
        ws.onopen = null
        ws.onclose = null
        ws.onerror = null
        ws.onmessage = null
      })
    )

    yield* Effect.log(`Connecting to socket at ${url}`)

    // Wait for connection to be established
    yield* Effect.callback<undefined, SocketError>((cb) => {
      ws.onopen = () => {
        ws.onopen = null
        ws.onerror = null
        cb(Effect.succeed(undefined))
      }
      ws.onerror = (err) => {
        ws.onopen = null
        ws.onerror = null
        cb(Effect.fail(new SocketError({originalError: err})))
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.onopen = null
        ws.onerror = null
        cb(Effect.succeed(undefined))
      }

      if (ws.readyState === WebSocket.CLOSED) {
        cb(
          Effect.fail(
            new SocketError({originalError: new Error('Web socket closed')})
          )
        )
      }
    })

    yield* Effect.log('Socket connected')

    const messagesStream = createMessagesStream(ws)
    const sendMessage = sendMessageToSocket(ws)

    const socketConnection = {
      sendMessage,
      messagesStream,
    }
    yield* pipe(runPingPong(socketConnection), Effect.forkChild)

    return socketConnection
  })
