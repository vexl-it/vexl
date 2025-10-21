import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ConfigError, Effect, Schema} from 'effect/index'
import {RedisLockError} from './RedisService'
import {TransactionError} from './withDbTransaction'

const UnexpectedServerErrors = Schema.Union(RedisLockError, TransactionError)

function isRExcludingHandledErrors<R>(
  e: R
): e is Exclude<
  R,
  ConfigError.ConfigError | typeof UnexpectedServerErrors.Type
> {
  return (
    Schema.is(NotFoundError)(e) ||
    (!ConfigError.isConfigError(e) && !Schema.is(UnexpectedServerErrors)(e))
  )
}

export const makeEndpointEffect = <A, R, I>(
  e: Effect.Effect<
    A,
    | R
    | UnexpectedServerError
    | ConfigError.ConfigError
    | NotFoundError
    | typeof UnexpectedServerErrors.Type,
    I
  >
): Effect.Effect<
  A,
  | Exclude<R, ConfigError.ConfigError | typeof UnexpectedServerErrors.Type>
  | UnexpectedServerError
  | NotFoundError,
  I
> =>
  e.pipe(
    Effect.catchAllDefect((e) =>
      Effect.zipRight(
        Effect.logFatal('Critical error on endpoint', e),
        Effect.fail(UnexpectedServerError.blindError())
      )
    ),
    Effect.catchAll(
      (
        e
      ): Effect.Effect<
        A,
        | Exclude<
            R,
            ConfigError.ConfigError | typeof UnexpectedServerErrors.Type
          >
        | UnexpectedServerError
        | NotFoundError,
        I
      > => {
        if (
          Schema.is(UnexpectedServerErrors)(e) ||
          ConfigError.isConfigError(e) ||
          // If the error is already an unexpected server error,
          // we still want to blind it to avoid leaking sensitive information
          Schema.is(UnexpectedServerError)(e)
        ) {
          return Effect.zipRight(
            Effect.logError('Unexpected server error in endpoint', e),
            Effect.fail(UnexpectedServerError.blindError())
          )
        }

        if (isRExcludingHandledErrors(e))
          return Effect.fail(e) satisfies Effect.Effect<
            any,
            | Exclude<
                R,
                ConfigError.ConfigError | typeof UnexpectedServerErrors.Type
              >
            | NotFoundError
          >

        return Effect.zipRight(
          Effect.logError('How can this happen? Unhandled error'),
          new UnexpectedServerError({
            status: 500,
            message: 'An unexpected error occurred',
            cause: new Error('Error'),
          })
        )
      }
    )
  )
