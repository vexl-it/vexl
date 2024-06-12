import {Chunk, Effect, HashMap, Option, Sink, Stream} from 'effect'
import {UserWithConnections} from '../../common/ServerMessage'
import {pubKeyToCountryPrefixChanges} from './pubKeyToCountry'
import {connectionsSortedByAddedChanges} from './pubKeysToConnectionsCount'

export const last10usersChanges = Stream.zipLatest(
  pubKeyToCountryPrefixChanges,
  connectionsSortedByAddedChanges
).pipe(
  Stream.mapEffect(([users, connections]) =>
    Stream.fromIterable(connections).pipe(
      Stream.filterMap((connection) =>
        HashMap.get(users, connection.publicKey).pipe(
          Option.map(
            (countryPrefix) =>
              new UserWithConnections({
                pubKey: connection.publicKey,
                connectionsCount: connection.count,
                countryPrefix,
                receivedAt: connection.date,
              })
          )
        )
      ),
      Stream.take(10),
      Stream.runCollect,
      Effect.map(Chunk.toArray)
    )
  ),
  Stream.changes
)

export const last10Users = Stream.run(last10usersChanges, Sink.head())
