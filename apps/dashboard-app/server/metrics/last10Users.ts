import {Chunk, Effect, HashMap, Option, Sink, Stream, pipe} from 'effect'
import {UserWithConnections} from '../../common/ServerMessage'
import {secureHash} from '../utils/hashPubKey'
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
          Option.map((countryPrefix) => ({
            pubKey: connection.publicKey,
            connectionsCount: connection.count,
            countryPrefix,
            receivedAt: connection.date,
          }))
        )
      ),
      Stream.mapEffect((user) =>
        pipe(
          secureHash(user.pubKey),
          Effect.map(
            (hash) => new UserWithConnections({...user, pubKey: hash})
          ),
          Effect.option
        )
      ),
      Stream.filterMap((a) => a),
      Stream.take(10),
      Stream.runCollect,
      Effect.map(Chunk.toArray)
    )
  ),
  Stream.changes
)

export const last10Users = Stream.run(last10usersChanges, Sink.head())
