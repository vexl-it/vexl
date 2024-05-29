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
  SortedSet,
  Stream,
  SubscriptionRef,
  pipe,
} from 'effect'
import {
  queryPubkeyToCountryPrefix,
  type PubKeyToCountryPrefixId,
  type UserRow,
} from '../db/queryPubkeyToCountryPrefix'

const sortIdsDesc: Order.Order<UserRow> = Order.struct({
  id: Order.reverse(Order.number),
})

export type UserRowWithDateReceived = UserRow & {receivedAt: UnixMilliseconds}

export class PubKeyToCountryPrefixState extends Context.Tag(
  'PubKeyToCountryPrefix'
)<
  PubKeyToCountryPrefixState,
  SubscriptionRef.SubscriptionRef<{
    pubKeyToCountryPrefix: HashMap.HashMap<PublicKeyPemBase64, CountryPrefix>
    usersSortedByAdded: SortedSet.SortedSet<UserRowWithDateReceived>
    lastIdFetched: Option.Option<PubKeyToCountryPrefixId>
  }>
>() {
  static readonly Live = Layer.effect(
    PubKeyToCountryPrefixState,
    SubscriptionRef.make({
      pubKeyToCountryPrefix: HashMap.empty<PublicKeyPemBase64, CountryPrefix>(),
      usersSortedByAdded: SortedSet.empty<UserRowWithDateReceived>(sortIdsDesc),
      lastIdFetched: Option.none<PubKeyToCountryPrefixId>(),
    })
  )
}

export const syncPubKeyToCountryEffect = PubKeyToCountryPrefixState.pipe(
  Effect.flatMap(
    SubscriptionRef.modifyEffect((value) =>
      Effect.gen(function* (_) {
        const newDataSinceLastFetch = yield* _(
          queryPubkeyToCountryPrefix(value.lastIdFetched)
        )
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

        const usersSortedByAdded = value.usersSortedByAdded.pipe(
          SortedSet.union(
            SortedSet.fromIterable(
              newDataSinceLastFetch.map((v) => ({
                ...v,
                receivedAt: unixMillisecondsNow(),
              })),
              sortIdsDesc
            )
          )
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
  Effect.map((v) => v.changes),
  Stream.unwrap,
  Stream.map((v) => v.pubKeyToCountryPrefix),
  Stream.changes
)

export const usersSortedByAddedChanges = PubKeyToCountryPrefixState.pipe(
  Effect.map((v) => v.changes),
  Stream.unwrap,
  Stream.map((v) => v.usersSortedByAdded),
  Stream.changes
)
