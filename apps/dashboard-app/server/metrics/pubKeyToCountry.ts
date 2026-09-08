import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Array,
  Context,
  Effect,
  HashMap,
  Layer,
  Option,
  Order,
  Stream,
  SubscriptionRef,
  pipe,
} from 'effect'
import {
  queryPubkeyToCountryPrefix,
  type PubKeyToCountryPrefixId,
  type UserRow,
} from '../db/queryPubkeyToCountryPrefix'

const sortIdsDesc: Order.Order<UserRow> = Order.Struct({
  id: Order.flip(Order.Number),
})

export type UserRowWithDateReceived = UserRow & {receivedAt: UnixMilliseconds}

const initialUsers: readonly UserRowWithDateReceived[] = []

export class PubKeyToCountryPrefixState extends Context.Service<
  PubKeyToCountryPrefixState,
  SubscriptionRef.SubscriptionRef<{
    pubKeyToCountryPrefix: HashMap.HashMap<PublicKeyPemBase64, CountryPrefix>
    usersSortedByAdded: readonly UserRowWithDateReceived[]
    lastIdFetched: Option.Option<PubKeyToCountryPrefixId>
  }>
>()('PubKeyToCountryPrefix') {
  static readonly Live = Layer.effect(
    PubKeyToCountryPrefixState,
    SubscriptionRef.make({
      pubKeyToCountryPrefix: HashMap.empty<PublicKeyPemBase64, CountryPrefix>(),
      usersSortedByAdded: initialUsers,
      lastIdFetched: Option.none<PubKeyToCountryPrefixId>(),
    })
  )
}

export const syncPubKeyToCountryEffect = PubKeyToCountryPrefixState.pipe(
  Effect.flatMap(
    SubscriptionRef.modifyEffect((value) =>
      Effect.gen(function* () {
        const newDataSinceLastFetch = yield* queryPubkeyToCountryPrefix(
          value.lastIdFetched
        )

        yield* Effect.log(`Got ${newDataSinceLastFetch.length} new users`)

        const lastIdFetched = pipe(
          Array.last(newDataSinceLastFetch),
          Option.map((a) => a.id),
          Option.orElse(() => value.lastIdFetched)
        )

        const pubkeyToCountryPrefixUpdated = pipe(
          newDataSinceLastFetch,
          Array.map((v) => [v.publicKey, v.countryPrefix] as const),
          HashMap.fromIterable,
          HashMap.union(value.pubKeyToCountryPrefix)
        )

        const usersSortedByAdded = pipe(
          newDataSinceLastFetch,
          Array.map((user): [UserRow['id'], UserRowWithDateReceived] => [
            user.id,
            {...user, receivedAt: unixMillisecondsNow()},
          ]),
          HashMap.fromIterable,
          HashMap.union(
            HashMap.fromIterable(
              Array.map(
                value.usersSortedByAdded,
                (user): [UserRow['id'], UserRowWithDateReceived] => [
                  user.id,
                  user,
                ]
              )
            )
          ),
          HashMap.values,
          Array.fromIterable,
          Array.sort(sortIdsDesc)
        )

        return [
          pubkeyToCountryPrefixUpdated,
          {
            pubKeyToCountryPrefix: pubkeyToCountryPrefixUpdated,
            lastIdFetched,
            usersSortedByAdded,
          },
        ] as const
      }).pipe(
        Effect.withSpan('syncPubKeyToCountryEffect', {
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

export const pubKeyToCountryPrefixChanges = PubKeyToCountryPrefixState.pipe(
  Effect.map((v) => SubscriptionRef.changes(v)),
  Stream.unwrap,
  Stream.map((v) => v.pubKeyToCountryPrefix),
  Stream.changes
)

export const usersSortedByAddedChanges = PubKeyToCountryPrefixState.pipe(
  Effect.map((v) => SubscriptionRef.changes(v)),
  Stream.unwrap,
  Stream.map((v) => v.usersSortedByAdded),
  Stream.changes
)
