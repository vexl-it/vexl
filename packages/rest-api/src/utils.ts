import {Effect, Schema} from 'effect'
import {type ClientError} from 'effect-http'
import {
  isServerSideError,
  type ClientErrorServerSide,
} from 'effect-http/ClientError'
import {
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  UnexpectedApiResponseError,
  UnknownClientError,
  UnknownServerError,
} from './Errors'

const DEFAULT_TIMEOUT_MS = 60_000 // Up timeout to 1 minute

export type LoggingFunction = (message?: any, ...optionalParams: any[]) => void

const handleErrorsEffect = <R, C = never>(
  effect: Effect.Effect<R, ClientError.ClientError<number>, C>
): Effect.Effect<
  R,
  | ClientErrorServerSide
  | NetworkError
  | NotFoundError
  | UnknownClientError
  | UnknownServerError
  | UnauthorizedError,
  C
> =>
  effect.pipe(
    Effect.timeout(DEFAULT_TIMEOUT_MS),
    Effect.catchAll((e) =>
      Effect.gen(function* (_) {
        if (e._tag === 'TimeoutException') {
          return yield* _(
            Effect.fail(
              new NetworkError({
                message: e.message,
                cause: e,
              })
            )
          )
        }

        if (isServerSideError(e)) {
          if (e.status === 401) {
            return yield* _(
              Effect.fail(
                new UnauthorizedError({
                  status: e.status,
                  message: e.message,
                  cause: e.error,
                })
              )
            )
          }

          if (e.status === 404) {
            return yield* _(
              Effect.fail(
                new NotFoundError({
                  status: e.status,
                  message: e.message,
                  cause: e.error,
                })
              )
            )
          }

          return yield* _(Effect.fail(e))
        }

        return yield* _(
          Effect.fail(
            new UnknownServerError({
              cause: e.error,
              message: e.message,
            })
          )
        )
      })
    ),
    Effect.catchAllDefect((defect) => {
      return Effect.fail(
        new UnknownClientError({
          cause: defect,
        })
      )
    })
  )

export const handleCommonErrorsEffect = <R, C = never>(
  effect: Effect.Effect<R, ClientError.ClientError<number>, C>
): Effect.Effect<
  R,
  | NetworkError
  | NotFoundError
  | UnknownClientError
  | UnknownServerError
  | UnauthorizedError,
  C
> =>
  handleErrorsEffect(effect).pipe(
    Effect.catchTag('ClientError', (error) =>
      Effect.fail(
        new UnknownClientError({
          cause: error,
        })
      )
    )
  )

export const handleCommonAndExpectedErrorsEffect = <R, B, R2, C = never>(
  effect: Effect.Effect<R, ClientError.ClientError<number>, C>,
  expectedErrors: Schema.Schema<B, any, R2>
): Effect.Effect<
  R,
  | NotFoundError
  | UnknownClientError
  | UnknownServerError
  | UnexpectedApiResponseError
  | UnauthorizedError
  | NetworkError
  | Schema.Schema.Type<Schema.Schema<B, any, R2>>,
  C | R2
> =>
  handleErrorsEffect(effect).pipe(
    Effect.catchTag('ClientError', (error) => {
      return Effect.gen(function* (_) {
        const decodedError = yield* _(
          Schema.decodeUnknown(expectedErrors)(error.error)
        )
        return yield* _(Effect.fail(decodedError))
      })
    }),
    Effect.catchTag('ParseError', () =>
      Effect.fail(
        new UnexpectedApiResponseError({
          cause: 'UnexpectedApiResponse',
          status: 500,
        })
      )
    )
  )
