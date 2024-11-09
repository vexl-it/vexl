// import {type ParseError} from 'effect/ParseResult'
import {
  Chunk,
  Data,
  Effect,
  Option,
  Schedule,
  Schema,
  Stream,
  pipe,
  type Scope,
} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {ServerMessage} from '../../common/ServerMessage'
import {ClientMessage, PingMessage} from './../../common/ClientMessage'

class SocketError extends Data.TaggedError('SocketError')<{
  originalError: unknown
}> {}

class SendingMessageError extends Data.TaggedError('SendingMessageError')<{
  originalError: unknown
}> {}

const encodeMessage = Schema.encode(Schema.parseJson(ClientMessage))

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
  ) => Effect.Effect<void, ParseError | SendingMessageError, never>
  messagesStream: Stream.Stream<ServerMessage, SocketError, never>
}

const parseMessage = Schema.decodeUnknown(Schema.parseJson(ServerMessage))

const createMessagesStream = (
  socket: WebSocket
): Stream.Stream<ServerMessage, SocketError> => {
  return Stream.async<MessageEvent<unknown>, SocketError>((emit) => {
    socket.onmessage = (event) => {
      void emit(Effect.succeed(Chunk.of(event)))
    }

    socket.onerror = (err) => {
      void emit(Effect.fail(Option.some(new SocketError({originalError: err}))))
    }

    socket.onclose = () => {
      void emit(Effect.fail(Option.none()))
    }
  }).pipe(
    Stream.mapEffect((v) => parseMessage(v.data)),
    Stream.catchTag('ParseError', () =>
      Effect.zipLeft(
        Effect.succeed(null),
        Effect.logError('Error while parsing message')
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
  Effect.gen(function* (_) {
    const ws = new WebSocket(url)
    yield* _(
      Effect.addFinalizer(() =>
        Effect.sync(() => {
          ws.close()
          ws.onopen = null
          ws.onclose = null
          ws.onerror = null
          ws.onmessage = null
        })
      )
    )

    yield* _(Effect.log(`Connecting to socket at ${url}`))

    // Wait for connection to be established
    yield* _(
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      Effect.async<void, SocketError>((cb) => {
        ws.onopen = () => {
          ws.onopen = null
          ws.onerror = null
          cb(Effect.void)
        }
        ws.onerror = (err) => {
          ws.onopen = null
          ws.onerror = null
          cb(Effect.fail(new SocketError({originalError: err})))
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.onopen = null
          ws.onerror = null
          cb(Effect.void)
        }

        if (ws.readyState === WebSocket.CLOSED) {
          cb(
            Effect.fail(
              new SocketError({originalError: new Error('Web socket closed')})
            )
          )
        }
      })
    )

    yield* _(Effect.log('Socket connected'))

    const messagesStream = createMessagesStream(ws)
    const sendMessage = sendMessageToSocket(ws)

    const socketConnection = {
      sendMessage,
      messagesStream,
    }
    yield* _(runPingPong(socketConnection), Effect.fork)

    return socketConnection
  })
