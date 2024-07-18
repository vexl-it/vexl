import {Schema, type ParseResult} from '@effect/schema'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Config, Context, Data, Effect, Layer, type ConfigError} from 'effect'
import {Redis} from 'ioredis'

export class RedisError extends Data.TaggedError('RedisError')<{
  originalError: unknown
}> {}

export class RecordDoesNotExistsReddisError extends Data.TaggedError(
  'RecordDoesNotExistsReddisError'
) {}

export interface RedisOperations {
  get: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string
  ) => Effect.Effect<
    A,
    ParseResult.ParseError | RedisError | RecordDoesNotExistsReddisError,
    R
  >

  set: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string,
    value: A,
    opts?: {expiresAt?: UnixMilliseconds}
  ) => Effect.Effect<void, ParseResult.ParseError | RedisError, R>

  delete: (key: string) => Effect.Effect<void, RedisError, never>
}

export class RedisService extends Context.Tag('RedisService')<
  RedisService,
  RedisOperations
>() {
  static readonly layer = (
    redisUrl: Config.Config<string> | string
  ): Layer.Layer<RedisService, ConfigError.ConfigError, never> =>
    Layer.effect(
      RedisService,
      Effect.gen(function* (_) {
        const redisUrlUnwrapped = Config.isConfig(redisUrl)
          ? yield* _(redisUrl)
          : redisUrl

        const redisClient = yield* _(
          Effect.sync(() => new Redis(redisUrlUnwrapped))
        )

        const getString = (
          key: string
        ): Effect.Effect<string, RedisError | RecordDoesNotExistsReddisError> =>
          Effect.async<string, RedisError | RecordDoesNotExistsReddisError>(
            (cb) => {
              void redisClient.get(key, (err, res) => {
                if (err) cb(Effect.fail(new RedisError({originalError: err})))
                else if (!res)
                  cb(Effect.fail(new RecordDoesNotExistsReddisError()))
                else cb(Effect.succeed(res))
              })
            }
          ).pipe(
            Effect.catchAllDefect((e) =>
              Effect.zipRight(
                Effect.logError('Error while reading reddis', e, key),
                Effect.fail(new RedisError({originalError: e}))
              )
            )
          )

        const setString = (
          key: string,
          value: string,
          expiresAt?: UnixMilliseconds
        ): Effect.Effect<void, RedisError> => {
          // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
          return Effect.async<void, RedisError>((cb) => {
            void redisClient.set(key, value, 'PXAT', expiresAt ?? -1, (err) => {
              if (err) cb(Effect.fail(new RedisError({originalError: err})))
              else cb(Effect.succeed(Effect.void))
            })
          }).pipe(
            Effect.catchAllDefect((e) =>
              Effect.zipRight(
                Effect.logError('Error while writing to reddis', e, key),
                Effect.fail(new RedisError({originalError: e}))
              )
            )
          )
        }

        const deleteKey = (key: string): Effect.Effect<void, RedisError> =>
          // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
          Effect.async<void, RedisError>((cb) => {
            void redisClient.del(key, (err) => {
              if (err) {
                cb(Effect.fail(new RedisError({originalError: err})))
              } else cb(Effect.succeed(Effect.void))
            })
          })

        // yield* _(Effect.addFinalizer(Effect.sync(() => redisClient.quit())) // TODO

        const toReturn: RedisOperations = {
          get: (schema) => {
            const decode = Schema.decode(Schema.parseJson(schema))

            return (key) => getString(key).pipe(Effect.flatMap(decode))
          },
          set: (schema) => {
            const encode = Schema.encode(Schema.parseJson(schema))

            return (key, value, opts) =>
              encode(value).pipe(
                Effect.flatMap((encoded) =>
                  setString(key, encoded, opts?.expiresAt)
                )
              )
          },
          delete: deleteKey,
        }

        return toReturn
      })
    )
}
