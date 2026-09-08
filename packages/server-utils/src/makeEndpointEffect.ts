import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Config, Effect, Schema} from 'effect'
import {RedisLockError} from './RedisService'
import {TransactionError} from './withDbTransaction'

const UnexpectedServerErrors = Schema.Union([RedisLockError, TransactionError])

function isRExcludingHandledErrors<R>(
  e: R
): e is Exclude<R, Config.ConfigError | typeof UnexpectedServerErrors.Type> {
  return (
    Schema.is(NotFoundError)(e) ||
    (!(e instanceof Config.ConfigError) &&
      !Schema.is(UnexpectedServerErrors)(e))
  )
}

export const makeEndpointEffect = <A, R, I>(
  e: Effect.Effect<
    A,
    | R
    | UnexpectedServerError
    | Config.ConfigError
    | NotFoundError
    | typeof UnexpectedServerErrors.Type,
    I
  >
): Effect.Effect<
  A,
  | Exclude<R, Config.ConfigError | typeof UnexpectedServerErrors.Type>
  | UnexpectedServerError
  | NotFoundError,
  I
> =>
  e.pipe(
    Effect.catch(
      (
        e
      ): Effect.Effect<
        A,
        | Exclude<R, Config.ConfigError | typeof UnexpectedServerErrors.Type>
        | UnexpectedServerError
        | NotFoundError,
        I
      > => {
        if (
          Schema.is(UnexpectedServerErrors)(e) ||
          e instanceof Config.ConfigError ||
          // If the error is already an unexpected server error,
          // we still want to blind it to avoid leaking sensitive information
          Schema.is(UnexpectedServerError)(e)
        ) {
          return Effect.andThen(
            Effect.logError('Unexpected server error in endpoint', e),
            Effect.fail(UnexpectedServerError.blindError())
          )
        }

        if (isRExcludingHandledErrors(e))
          return Effect.fail(e) satisfies Effect.Effect<
            any,
            | Exclude<
                R,
                Config.ConfigError | typeof UnexpectedServerErrors.Type
              >
            | NotFoundError
          >

        return Effect.andThen(
          Effect.logError('How can this happen? Unhandled error'),
          new UnexpectedServerError({
            status: 500,
            message: 'An unexpected error occurred',
            cause: new Error('Error'),
          })
        )
      }
    ),
    Effect.catchDefect((e) =>
      Effect.andThen(
        Effect.logFatal('Critical error on endpoint', e),
        Effect.fail(UnexpectedServerError.blindError())
      )
    )
  )
