import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, type Option} from 'effect'

export const orNotFound = <A, E, R>(
  effect: Effect.Effect<Option.Option<A>, E, R>
): Effect.Effect<A, E | NotFoundError, R> =>
  effect.pipe(
    Effect.flatten,
    Effect.catchTag('NoSuchElementException', () => new NotFoundError())
  )
