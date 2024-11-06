import {Effect} from 'effect'
import * as E from 'fp-ts/Either'
import type * as T from 'fp-ts/Task'
import type * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'

export function effectToTaskEither<L, R>(
  effect: Effect.Effect<R, L>
): TE.TaskEither<L, R> {
  return async () => {
    const result = await Effect.runPromise(effect.pipe(Effect.either))
    return result._tag === 'Right' ? E.right(result.right) : E.left(result.left)
  }
}

export function effectToTask<A>(
  effect: Effect.Effect<A, never, never>
): T.Task<A> {
  return async () => {
    return await Effect.runPromise(effect)
  }
}

export function eitherToEfect<L, R>(
  either: E.Either<L, R>
): Effect.Effect<R, L> {
  return pipe(
    either,
    E.matchW(
      (e) => Effect.fail(e),
      (a) => Effect.succeed(a)
    )
  )
}

export function taskEitherToEffect<L, R>(
  taskEither: TE.TaskEither<L, R>
): Effect.Effect<R, L> {
  return Effect.promise(taskEither).pipe(Effect.flatMap(eitherToEfect))
}
