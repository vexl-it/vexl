import {Data, Effect, Layer, Match, Schema, Stream, flow, pipe} from 'effect'
import {type RawData, type WebSocket} from 'ws'
import {ClientMessage} from '../../common/ClientMessage'
import {
  PongMessage,
  ReceivedUnexpectedMessage,
  type ServerMessage,
} from '../../common/ServerMessage'
import {type CountOfUsersState} from '../metrics/countOfUsers'
import {type PubKeyToCountryPrefixState} from '../metrics/pubKeyToCountry'
import {type CountriesToConnectionsCountState} from '../metrics/pubKeysToConnectionsCount'
import {type HasingSalt} from '../utils/hashPubKey'
import encodeAndSendMessage from './encodeAndSendMessage'
import listenAndSendUpdatesToConnections from './listenAndSendUpdatesToConnection'
import {IncommingConnectionsStreamContext} from './serverSocket'
import {
  createMessagesStream,
  dataToString,
  type SendingMessageError,
} from './utils'

export const decodeMessageFromClient = pipe(
  Schema.parseJson(ClientMessage),
  Schema.decodeUnknown
)

const handleMessagesFromClient =
  (
    sendMessage: (
      message: ServerMessage
    ) => Effect.Effect<void, SendingMessageError, never>
  ): ((message: RawData) => Effect.Effect<void, SendingMessageError, never>) =>
  (message) =>
    pipe(
      dataToString(message),
      Effect.flatMap(decodeMessageFromClient),
      Effect.flatMap((a) =>
        Match.value(a).pipe(
          Match.tag('DebugMessage', (m) =>
            Effect.logInfo('Got debug message', m)
          ),
          Match.tag('PingMessage', () => sendMessage(new PongMessage())),
          Match.exhaustive
        )
      ),
      Effect.catchTag('ReadingDataError', (e) =>
        Effect.logWarning('Unable to read message', e)
      ),
      Effect.catchTag('ParseError', (e) =>
        Effect.zipRight(
          Effect.logWarning('Error parsing message from client', e),
          dataToString(message).pipe(
            Effect.catchAll(() => Effect.succeed('[unable to read message]')),
            Effect.flatMap((decodedMessage) =>
              sendMessage(
                new ReceivedUnexpectedMessage({
                  messageReceived: decodedMessage,
                })
              )
            )
          )
        )
      )
    )

export class TimeoutError extends Data.TaggedError('TimeoutError') {}

const handleClientConnection = (
  connection: WebSocket
): Effect.Effect<
  void,
  never,
  | PubKeyToCountryPrefixState
  | CountriesToConnectionsCountState
  | CountOfUsersState
  | HasingSalt
> =>
  Effect.gen(function* (_) {
    yield* _(Effect.log('New connection'))

    const handleMessage = handleMessagesFromClient(
      encodeAndSendMessage(connection)
    )

    const processMessages = pipe(
      createMessagesStream(connection),
      Stream.tap(handleMessage),
      Stream.timeoutFail(() => new TimeoutError(), '60 seconds'),
      Stream.runDrain
    )

    yield* _(
      Effect.raceAll([
        Effect.either(processMessages),
        Effect.either(listenAndSendUpdatesToConnections(connection)),
      ]),
      Effect.flatMap(Effect.fail),
      Effect.tapError((e) =>
        Effect.zip(
          Effect.log('Connection ended. Closing', e),
          Effect.sync(() => {
            connection.close()
          })
        )
      ),
      Effect.ignore
    )
  }).pipe(Effect.withSpan('handleClientConnection'))

export const SocketServerLive = Layer.scopedDiscard(
  IncommingConnectionsStreamContext.pipe(
    Effect.flatMap(Stream.runForEach(flow(handleClientConnection, Effect.fork)))
  )
).pipe(Layer.withSpan('SocketServerLive'))
