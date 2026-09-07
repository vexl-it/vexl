import {Data, Effect, Layer, Match, Schema, Stream, flow, pipe} from 'effect'
import {type RawData, type WebSocket} from 'ws'
import {ClientMessage} from '../../common/ClientMessage'
import {
  PongMessage,
  ReceivedUnexpectedMessage,
  type ServerMessage,
} from '../../common/ServerMessage'
import {
  getDashboardBootstrapMessage,
  type DashboardBootstrapState,
} from '../dashboardBootstrapState'
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
  Schema.fromJsonString(ClientMessage),
  Schema.decodeUnknownEffect
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
      Effect.catchTag('SchemaError', (e) =>
        Effect.andThen(
          Effect.logWarning('Error parsing message from client', e),
          dataToString(message).pipe(
            Effect.catch(() => Effect.succeed('[unable to read message]')),
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
  | DashboardBootstrapState
  | HasingSalt
> =>
  Effect.gen(function* () {
    yield* Effect.log('New connection')

    const handleMessage = handleMessagesFromClient(
      encodeAndSendMessage(connection)
    )

    yield* encodeAndSendMessage(connection)(
      yield* getDashboardBootstrapMessage
    ).pipe(
      Effect.catch((error) =>
        Effect.logWarning(
          'Unable to send initial dashboard bootstrap message',
          error
        )
      )
    )

    const processMessages = pipe(
      createMessagesStream(connection),
      Stream.tap(handleMessage),
      Stream.timeoutOrElse({
        duration: '60 seconds',
        orElse: () => Stream.fail(new TimeoutError()),
      }),
      Stream.runDrain
    )

    yield* pipe(
      Effect.raceAll([
        Effect.result(processMessages),
        Effect.result(listenAndSendUpdatesToConnections(connection)),
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

export const SocketServerLive = Layer.effectDiscard(
  IncommingConnectionsStreamContext.pipe(
    Effect.flatMap(
      Stream.runForEach(flow(handleClientConnection, Effect.forkChild))
    )
  )
).pipe(Layer.withSpan('SocketServerLive'))
