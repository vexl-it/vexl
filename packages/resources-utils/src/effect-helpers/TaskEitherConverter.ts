import {Effect} from 'effect'
import * as E from 'fp-ts/Either'
import type * as TE from 'fp-ts/TaskEither'

export function effectToTaskEither<L, R>(
  effect: Effect.Effect<R, L>
): TE.TaskEither<L, R> {
  return async () => {
    const result = await Effect.runPromise(effect.pipe(Effect.either))
    return result._tag === 'Right' ? E.right(result.right) : E.left(result.left)
  }
}
