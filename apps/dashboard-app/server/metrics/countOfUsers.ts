import {Context, Effect, Layer, Sink, Stream, SubscriptionRef} from 'effect'
import {queryNumberOfUsers} from '../db/queryCountOfUsers'

export class CountOfUsersState extends Context.Tag('CountOfUsersState')<
  CountOfUsersState,
  SubscriptionRef.SubscriptionRef<{count: number}>
>() {
  static readonly Live = Layer.effect(
    CountOfUsersState,
    SubscriptionRef.make({count: 0})
  )
}

export const syncCountOfUsersEffect = CountOfUsersState.pipe(
  Effect.flatMap(
    SubscriptionRef.updateEffect(() =>
      Effect.map(queryNumberOfUsers, (count) => ({count})).pipe(
        Effect.withSpan('Updating countOfUsersState')
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
