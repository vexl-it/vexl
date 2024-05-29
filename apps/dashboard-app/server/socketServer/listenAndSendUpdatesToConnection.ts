import {Array, Effect, HashMap, Order, Stream, pipe} from 'effect'
import {type WebSocket} from 'ws'
import {
  ConnectionsCountByCountry,
  ConnectionsCountByCountryListMessage,
  NewUserWithConnectionsMessage,
  TotalUsersCountMessage,
  type ServerMessage,
} from '../../common/ServerMessage'
import {countOfUsersChanges} from '../metrics/countOfUsers'
import {countriesToConnectionsCountChanges} from '../metrics/countryToConnectionCount'
import {last10usersChanges} from '../metrics/last10Users'
import {type PubKeyToCountryPrefixState} from '../metrics/pubKeyToCountry'
import {type CountriesToConnectionsCountState} from '../metrics/pubKeysToConnectionsCount'
import encodeAndSendMessage from './encodeAndSendMessage'
import {type SendingMessageError} from './utils'

const changeMessagesToSendStream = Stream.mergeAll(
  [
    last10usersChanges.pipe(
      Stream.map(
        (v): ServerMessage =>
          new NewUserWithConnectionsMessage({userWithConnections: v})
      )
    ),
    countOfUsersChanges.pipe(
      Stream.map(
        (v): ServerMessage => new TotalUsersCountMessage({totalUsersCount: v})
      )
    ),
    countriesToConnectionsCountChanges.pipe(
      Stream.map(
        (v): ServerMessage =>
          new ConnectionsCountByCountryListMessage({
            type: 'full',
            connectionsCountByCountryList: pipe(
              Array.fromIterable(HashMap.entries(v)),
              Array.map(
                ([countryCode, count]) =>
                  new ConnectionsCountByCountry({
                    countryCode,
                    count,
                  })
              ),
              Array.sortBy(
                Order.reverse(Order.mapInput(Order.number, (a) => a.count))
              )
            ),
          })
      )
    ),
  ],
  {concurrency: 'unbounded'}
)

const listenAndSendUpdatesToConnection = (
  connection: WebSocket
): Effect.Effect<
  void,
  SendingMessageError,
  PubKeyToCountryPrefixState | CountriesToConnectionsCountState
> => {
  const handleMessage = encodeAndSendMessage(connection)

  return changeMessagesToSendStream.pipe(
    Stream.runForEach(handleMessage),
    Effect.withSpan('listenAndSendUpdatesToConnections')
  )
}

export default listenAndSendUpdatesToConnection
