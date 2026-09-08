import {Effect, Result} from 'effect'
import * as E from 'fp-ts/Either'
import type * as T from 'fp-ts/Task'
import type * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'

export function effectToTaskEither<L, R>(
  effect: Effect.Effect<R, L>
): TE.TaskEither<L, R> {
  return async () => {
    const result = await Effect.runPromise(effect.pipe(Effect.result))
    return result._tag === 'Success'
      ? E.right(result.success)
      : E.left(result.failure)
  }
}

export function effectToEither<L, R>(
  effect: Effect.Effect<R, L>
): E.Either<L, R> {
  const result = Effect.runSync(effect.pipe(Effect.result))
  return result._tag === 'Success'
    ? E.right(result.success)
    : E.left(result.failure)
}

export function effectToTask<A>(
  effect: Effect.Effect<A, never, never>
): T.Task<A> {
  return async () => {
    return await Effect.runPromise(effect)
  }
}

export function eitherToEffect<L, R>(
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
  return Effect.promise(taskEither).pipe(Effect.flatMap(eitherToEffect))
}

export function taskToEffect<A>(task: T.Task<A>): Effect.Effect<A, never> {
  return Effect.promise(task)
}

export function resultToEither<A, Error>(
  result: Result.Result<A, Error>
): E.Either<Error, A> {
  return Result.match(result, {onFailure: E.left, onSuccess: E.right})
}
