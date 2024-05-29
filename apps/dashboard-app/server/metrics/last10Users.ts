import {Chunk, Effect, HashMap, Option, Sink, Stream} from 'effect'
import {UserWithConnections} from '../../common/ServerMessage'
import {usersSortedByAddedChanges} from './pubKeyToCountry'
import {pubKeysToConnectionsChanges} from './pubKeysToConnectionsCount'

export const last10usersChanges = Stream.zipLatest(
  usersSortedByAddedChanges,
  pubKeysToConnectionsChanges
).pipe(
  Stream.mapEffect(([users, connections]) =>
    Stream.fromIterable(users).pipe(
      Stream.filterMap((user) =>
        HashMap.get(connections, user.publicKey).pipe(
          Option.map(
            (connectionsCount) =>
              new UserWithConnections({
                pubKey: user.publicKey,
                connectionsCount,
                countryPrefix: user.countryPrefix,
                receivedAt: user.receivedAt,
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
