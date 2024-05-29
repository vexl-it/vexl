import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  Array,
  Context,
  Effect,
  HashMap,
  Layer,
  Option,
  Stream,
  SubscriptionRef,
} from 'effect'
import {type ContactConnectionId} from '../db/ContactConnectionId'
import {queryMaxIdConnections} from '../db/queryMaxIdConnections'
import {queryPubkeysToConnections} from '../db/queryPubkeyToConnectionCount'

export class CountriesToConnectionsCountState extends Context.Tag(
  'CountriesToConnectionsCountState'
)<
  CountriesToConnectionsCountState,
  SubscriptionRef.SubscriptionRef<{
    pubKeyToConnectionsCount: HashMap.HashMap<PublicKeyPemBase64, number>
    lastIdFetched: Option.Option<ContactConnectionId>
  }>
>() {
  static readonly Live = Layer.effect(
    CountriesToConnectionsCountState,
    SubscriptionRef.make({
      pubKeyToConnectionsCount: HashMap.empty<PublicKeyPemBase64, number>(),
      lastIdFetched: Option.none<ContactConnectionId>(),
    })
  )
}

export const syncCountriesToConnectionsEffect =
  CountriesToConnectionsCountState.pipe(
    Effect.flatMap(
      SubscriptionRef.updateEffect((value) =>
        Effect.gen(function* (_) {
          const maxId = yield* _(queryMaxIdConnections)
          const delta = yield* _(
            queryPubkeysToConnections({maxId, minId: value.lastIdFetched}),
            Effect.map(Array.map((a) => [a.publicKey, a.count] as const)),
            Effect.map(HashMap.fromIterable)
          )

          const updatedState = HashMap.union(
            value.pubKeyToConnectionsCount,
            delta
          )

          return {
            pubKeyToConnectionsCount: updatedState,
            lastIdFetched: Option.some(maxId),
          }
        }).pipe(
          Effect.withSpan('Updating countriesToConnectionsCountState', {
            attributes: {
              lastIdFetched: Option.getOrElse(
                value.lastIdFetched,
                () => 'none yet'
              ),
            },
          })
        )
      )
    )
  )

export const pubKeysToConnectionsChanges =
  CountriesToConnectionsCountState.pipe(
    Effect.map((a) => a.changes),
    Stream.unwrap,
    Stream.map((a) => a.pubKeyToConnectionsCount),
    Stream.changes
  )
