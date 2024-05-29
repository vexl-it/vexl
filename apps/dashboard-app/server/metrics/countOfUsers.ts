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
        const delta = yield* _(queryNumberOfUsers(value.lastIdFetched))

        return {
          count: value.count + delta.count,
          lastIdFetched: Option.some(delta.maxId),
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
