import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, Schema} from 'effect'

export const makeMiddlewareEffect =
  <A, I, R, R2 extends Schema.Constraint>(errorsToLetThrough: R2) =>
  (
    e: Effect.Effect<A, R, I>
  ): Effect.Effect<A, UnexpectedServerError | Schema.Schema.Type<R2>, I> =>
    e.pipe(
      Effect.catchDefect((e) =>
        Effect.andThen(
          Effect.logFatal('Critical error in middleware', e),
          Effect.fail(UnexpectedServerError.blindError())
        )
      ),
      Effect.tapError((e) => {
        if (Schema.is(errorsToLetThrough)(e)) {
          return Effect.void
        }
        return Effect.logError('Middleware error', e)
      }),
      Effect.mapError((e) => {
        if (Schema.is(errorsToLetThrough)(e)) {
          return e as Schema.Schema.Type<R2>
        }

        return UnexpectedServerError.blindError()
      })
    )
