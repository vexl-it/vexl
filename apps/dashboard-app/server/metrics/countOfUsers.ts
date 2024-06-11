import {
  Context,
  Effect,
  Layer,
  Option,
  Sink,
  Stream,
  SubscriptionRef,
} from 'effect'
import {type ContactConnectionId} from '../db/ContactConnectionId'
import {queryNumberOfUsers} from '../db/queryCountOfUsers'

export class CountOfUsersState extends Context.Tag('CountOfUsersState')<
  CountOfUsersState,
  SubscriptionRef.SubscriptionRef<{
    count: number
    lastIdFetched: Option.Option<ContactConnectionId>
  }>
>() {
  static readonly Live = Layer.effect(
    CountOfUsersState,
    SubscriptionRef.make({
      count: 0,
      lastIdFetched: Option.none<ContactConnectionId>(),
    })
  )
}

export const syncCountOfUsersEffect = CountOfUsersState.pipe(
  Effect.flatMap(
    SubscriptionRef.updateEffect((value) =>
      Effect.gen(function* (_) {
        const delta = yield* _(queryNumberOfUsers(Option.none()))

        // // If there is no new delta, maxId will be none. In that case, use last id known
        // const lastIdFetched = delta.maxId.pipe(
        //   Option.orElse(() => value.lastIdFetched)
        // )

        return {
          count: delta.count,
          lastIdFetched: Option.none(),
        }
      }).pipe(
        Effect.withSpan('Updating countOfUsersState', {
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

export const countOfUsersChanges = CountOfUsersState.pipe(
  Effect.map((a) => a.changes),
  Stream.unwrap,
  Stream.map((v) => v.count),
  Stream.changes
)

export const countOfUsers = Stream.run(countOfUsersChanges, Sink.head())
