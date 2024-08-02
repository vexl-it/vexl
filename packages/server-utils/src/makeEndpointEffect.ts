import {Schema} from '@effect/schema'
import {
  type NotFoundError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {type ConfigError, Effect} from 'effect'
import {HttpError} from 'effect-http'
import {isTagged} from 'effect/Predicate'
import {isRunningInTestConfig} from './commonConfigs'
import {type ExpectedErrorHttpCode} from './HttpCodes'
import {type RedisLockError} from './RedisService'
import {type TransactionError} from './withDbTransaction'

type ErrorBodyContent =
  | (any & {
      _tag: string
      status: Schema.Schema.Type<typeof ExpectedErrorHttpCode>
    })
  | Schema.Schema.Type<typeof Schema.Void>

type HandlableErrors =
  | ConfigError.ConfigError
  | UnexpectedServerError
  | NotFoundError
  | HttpError.HttpError
  | RedisLockError
  | TransactionError

const makeEndpointEffect = <R, B, R2, C = never>(
  effect: Effect.Effect<
    R,
    | Schema.Schema.Type<Schema.Schema<B, ErrorBodyContent, R2>>
    | HandlableErrors,
    C
  >,
  expectedErrors: Schema.Schema<B, ErrorBodyContent, R2>
): Effect.Effect<R, HttpError.HttpError, C | R2> =>
  effect.pipe(
    Effect.catchAllDefect((e) => {
      return Effect.zipRight(
        Effect.logFatal('Critical error on endpoint', e),
        Effect.fail(HttpError.make(500, 'Internal server error'))
      )
    }),
    Effect.catchAll((error) =>
      Effect.gen(function* (_) {
        const isInTest = yield* _(isRunningInTestConfig)

        if (isTagged(error, 'ConfigError')) {
          if (!isInTest)
            yield* _(Effect.logError('Got config error in route', error))
          return yield* _(
            Effect.fail(HttpError.make(500, 'Internal server error'))
          )
        }

        if (isTagged(error, 'NotFoundError')) {
          return yield* _(Effect.fail(HttpError.make(404, 'Not found')))
        }

        if (isTagged(error, 'RedisLockError')) {
          return yield* _(Effect.fail(HttpError.make(404, 'Not found')))
        }

        if (isTagged(error, 'UnexpectedServerError')) {
          if (!isInTest)
            yield* _(Effect.logError('Got unexpected error in route', error))
          return yield* _(
            Effect.fail(HttpError.make(500, 'Internal server error'))
          )
        }

        if (HttpError.isHttpError(error)) {
          if (!isInTest) yield* _(Effect.log('Returning http error', error))
          return yield* _(Effect.fail(error))
        }

        if (!expectedErrors) {
          yield* _(
            Effect.logFatal(
              'Got error from endpoint that is really not expected',
              error
            )
          )
          return yield* _(
            Effect.fail(HttpError.make(500, 'Internal Server Error'))
          )
        }

        const encoded = yield* _(Schema.encodeUnknown(expectedErrors)(error))
        if (!isInTest)
          yield* _(Effect.log('Returning encoded expected error', encoded))
        return yield* _(Effect.fail(HttpError.make(encoded.status, encoded)))
      })
    ),
    Effect.catchTag('ConfigError', () =>
      Effect.fail(HttpError.make(500, 'Internal Server Error'))
    ),
    Effect.catchTag('ParseError', (e) =>
      Effect.zipRight(
        Effect.logFatal(
          'Got error from endpoint that is really not expected',
          e
        ),
        Effect.fail(HttpError.make(500, 'Internal Server Error'))
      )
    )
  )

export default makeEndpointEffect
