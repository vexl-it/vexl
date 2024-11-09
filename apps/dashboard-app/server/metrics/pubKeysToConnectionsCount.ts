import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  UnixMillisecondsE,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Array,
  Context,
  Effect,
  HashMap,
  Layer,
  Option,
  Order,
  Schema,
  Stream,
  SubscriptionRef,
} from 'effect'
import {type ContactConnectionId} from '../db/ContactConnectionId'
import {queryMaxIdConnections} from '../db/queryMaxIdConnections'
import {queryPubkeysToConnections} from '../db/queryPubkeyToConnectionCount'

export class CountWithDate extends Schema.Class<CountWithDate>('CountWithDate')(
  {
    date: UnixMillisecondsE,
    count: Schema.Number,
  }
) {}

export class CountriesToConnectionsCountState extends Context.Tag(
  'CountriesToConnectionsCountState'
)<
  CountriesToConnectionsCountState,
  SubscriptionRef.SubscriptionRef<{
    pubKeyToConnectionsCount: HashMap.HashMap<PublicKeyPemBase64, CountWithDate>
    lastIdFetched: Option.Option<ContactConnectionId>
  }>
>() {
  static readonly Live = Layer.effect(
    CountriesToConnectionsCountState,
    SubscriptionRef.make({
      pubKeyToConnectionsCount: HashMap.empty<
        PublicKeyPemBase64,
        CountWithDate
      >(),
      lastIdFetched: Option.none<ContactConnectionId>(),
    })
  )
}

export const syncCountriesToConnectionsEffect =
  CountriesToConnectionsCountState.pipe(
    Effect.flatMap(
      SubscriptionRef.updateEffect((value) =>
        Effect.gen(function* (_) {
          const now = unixMillisecondsNow()
          const maxId = yield* _(queryMaxIdConnections)
          const delta = yield* _(
            queryPubkeysToConnections({maxId, minId: value.lastIdFetched}),
            Effect.map(
              Array.map(
                (a) =>
                  [
                    a.publicKey,
                    new CountWithDate({count: a.count, date: now}),
                  ] as const
              )
            ),
            Effect.map(HashMap.fromIterable)
          )

          yield* _(Effect.log(`Got ${HashMap.size(delta)} new connections`))

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

export class ConnectionWithDate extends Schema.Class<ConnectionWithDate>(
  'ConnectionWithDate'
)({
  publicKey: PublicKeyPemBase64E,
  date: UnixMillisecondsE,
  count: Schema.Number,
}) {}

const sortConnectionWithDateDesc: Order.Order<ConnectionWithDate> =
  Order.reverse(
    Order.struct({
      date: Order.number,
    })
  )

export const connectionsSortedByAddedChanges = pubKeysToConnectionsChanges.pipe(
  Stream.map(HashMap.entries),
  Stream.map(Array.fromIterable),
  Stream.map(
    Array.map(
      ([pubKey, {date, count}]) =>
        new ConnectionWithDate({
          publicKey: pubKey,
          date,
          count,
        })
    )
  ),
  Stream.map(Array.sort(sortConnectionWithDateDesc)),
  Stream.changes
)
