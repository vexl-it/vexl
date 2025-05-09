import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Array,
  Context,
  Data,
  Duration,
  Effect,
  Layer,
  Option,
  Schema,
  type ParseResult,
} from 'effect'
import {type NonEmptyArray} from 'effect/Array'
import {catchAllDefect} from 'effect/Effect'
import Redlock, {type Lock} from 'redlock'
import {RedisConnectionService} from './RedisConnection'

export class RedisError extends Data.TaggedError('RedisError')<{
  originalError: unknown
}> {}

export class RedisLockError extends Data.TaggedError('RedisLockError')<{
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

  insertToSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string,
    ...value: NonEmptyArray<A>
  ) => Effect.Effect<void, ParseResult.ParseError | RedisError, R>

  readAndDeleteSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string
  ) => Effect.Effect<
    readonly A[],
    ParseResult.ParseError | RedisError | RecordDoesNotExistsReddisError,
    R
  >

  delete: (key: string) => Effect.Effect<void, RedisError, never>
  withLock: <A, E, R>(
    program: Effect.Effect<A, E, R>
  ) => (
    resources: string[] | string,
    duration?: Duration.DurationInput
  ) => Effect.Effect<A, E | RedisLockError, R>
}

export class RedisService extends Context.Tag('RedisService')<
  RedisService,
  RedisOperations
>() {
  static readonly Live = Layer.effect(
    RedisService,
    Effect.gen(function* (_) {
      const redisClient = yield* _(RedisConnectionService)

      const redlock = yield* _(Effect.sync(() => new Redlock([redisClient])))

      const acquireLockEffect = (
        resources: string[] | string,
        duration: Duration.DurationInput
      ): Effect.Effect<Lock, RedisLockError> =>
        Effect.promise(
          async () =>
            await redlock.acquire(
              Array.isArray(resources) ? resources : [resources],
              Duration.toMillis(duration)
            )
        ).pipe(
          Effect.zipLeft(
            Effect.logInfo('Acquired Reids lock', {
              resources,
              duration,
            })
          ),
          catchAllDefect((e) =>
            Effect.zipRight(
              Effect.logError(
                'Error while acquiring lock',
                e,
                resources,
                duration
              ),
              new RedisLockError({
                originalError: e,
              })
            )
          )
        )

      const releaseLockEffect = (lock: Lock): Effect.Effect<void> => {
        const now = Date.now()
        if (lock.expiration < now) {
          return Effect.logWarning(
            `Attempted to release an expired lock. Lock time of ${lock.resources.join()} should be increased`,
            {
              resources: lock.expiration,
              overExpirationMillis: now - lock.expiration,
            }
          )
        }

        return Effect.promise(async () => await redlock.release(lock)).pipe(
          Effect.zipLeft(Effect.logInfo('Released Redis lock', lock.resources)),
          catchAllDefect((e) =>
            Effect.zipRight(
              Effect.logError('Error while releasing lock', e, lock),
              Effect.void
            )
          )
        )
      }

      const withLock: RedisOperations['withLock'] =
        (program) =>
        (resources, duration = '300 millis') =>
          Effect.acquireUseRelease(
            acquireLockEffect(resources, duration),
            () => program,
            releaseLockEffect
          ).pipe(
            Effect.withSpan('Redis lock', {
              attributes: {resources, duration},
            })
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
          ),
          Effect.withSpan('Redis get', {attributes: {key}})
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
          ),
          Effect.withSpan('Redis set', {attributes: {key, value, expiresAt}})
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
        }).pipe(Effect.withSpan('Redis delete', {attributes: {key}}))

      const insertToSet = (
        key: string,
        ...value: string[]
      ): Effect.Effect<void, RedisError> =>
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        Effect.async<void, RedisError>((cb) => {
          void redisClient.sadd(key, ...value, (err) => {
            if (err) {
              cb(Effect.fail(new RedisError({originalError: err})))
            } else {
              cb(Effect.succeed(Effect.void))
            }
          })
        }).pipe(Effect.withSpan('Redis insertToList', {attributes: {key}}))

      const decodeListResult = Schema.decodeUnknownOption(
        Schema.NullishOr(Schema.Array(Schema.String))
      )

      const readAndDeleteSet = (
        key: string
      ): Effect.Effect<Option.Option<readonly string[]>, RedisError> =>
        Effect.async<Option.Option<readonly string[]>, RedisError>((cb) => {
          void redisClient
            .multi()
            .smembers(key)
            .del(key)
            .exec((err, res) => {
              const listResult = res?.[0]

              if (!listResult) {
                cb(
                  Effect.fail(
                    new RedisError({originalError: new Error('No result')})
                  )
                )
                return
              }

              const [listError, listDataUnknown] = listResult
              const listData = decodeListResult(listDataUnknown)

              if (err ?? listError) {
                cb(
                  Effect.fail(new RedisError({originalError: err ?? listError}))
                )
              } else if (Option.isNone(listData)) {
                cb(
                  Effect.fail(
                    new RedisError({
                      originalError: new Error('Unable to decode list data'),
                    })
                  )
                )
              } else {
                cb(
                  Effect.succeed(
                    listData.value && listData.value.length > 0
                      ? Option.some(listData.value)
                      : Option.none()
                  )
                )
              }
            })
        }).pipe(Effect.withSpan('Redis readAndDeleteList', {attributes: {key}}))

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
        insertToSet: (schema) => {
          const encode = Schema.encode(Schema.Array(Schema.parseJson(schema)))
          return (key, ...value) =>
            encode(value).pipe(
              Effect.flatMap((encoded) => insertToSet(key, ...encoded))
            )
        },
        readAndDeleteSet: (schema) => {
          const decode = Schema.decode(Schema.Array(Schema.parseJson(schema)))
          return (key) =>
            readAndDeleteSet(key).pipe(
              Effect.flatten,
              Effect.flatMap(decode),
              Effect.catchTag(
                'NoSuchElementException',
                () => new RecordDoesNotExistsReddisError()
              )
            )
        },
        delete: deleteKey,
        withLock,
      }

      return toReturn
    })
  )
}

export const withRedisLock: <A, E, R>(
  resources: string[] | string,
  duration?: Duration.DurationInput
) => (
  program: Effect.Effect<A, E, R>
) => Effect.Effect<A, E | RedisLockError, R | RedisService> =
  (resources, duration) => (program) =>
    RedisService.pipe(
      Effect.flatMap((rs) => rs.withLock(program)(resources, duration))
    )
