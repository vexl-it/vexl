import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Array,
  Context,
  Duration,
  Effect,
  Layer,
  Option,
  Schema,
  type ParseResult,
} from 'effect'
import {
  isNonEmptyReadonlyArray,
  type NonEmptyArray,
  type NonEmptyReadonlyArray,
} from 'effect/Array'
import {NoSuchElementException} from 'effect/Cause'
import {catchAllDefect} from 'effect/Effect'
import Redlock, {type Lock} from 'redlock'
import {RedisConnectionService} from './RedisConnection'

export class RedisError extends Schema.TaggedError<RedisError>('RedisError')(
  'RedisError',
  {
    cause: Schema.Unknown,
  }
) {}

export class RedisLockError extends Schema.TaggedError<RedisLockError>(
  'RedisLockError'
)('RedisLockError', {
  cause: Schema.Unknown,
}) {}

export interface RedisOperations {
  get: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string
  ) => Effect.Effect<
    A,
    ParseResult.ParseError | RedisError | NoSuchElementException,
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
    values: NonEmptyArray<A>,
    opts?: {expiresAt?: UnixMilliseconds}
  ) => Effect.Effect<void, ParseResult.ParseError | RedisError, R>

  deleteFromSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string,
    values: NonEmptyArray<A>
  ) => Effect.Effect<void, ParseResult.ParseError | RedisError, R>

  readAndDeleteSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string
  ) => Effect.Effect<
    readonly A[],
    ParseResult.ParseError | RedisError | NoSuchElementException,
    R
  >

  getSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string
  ) => Effect.Effect<
    readonly [A, ...A[]],
    ParseResult.ParseError | RedisError | NoSuchElementException,
    R
  >

  setExpiresAt: (
    key: string,
    expiresAt: UnixMilliseconds
  ) => Effect.Effect<void, RedisError | NoSuchElementException>

  exists: (key: string) => Effect.Effect<boolean, RedisError>

  isInSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string,
    value: A
  ) => Effect.Effect<boolean, ParseResult.ParseError | RedisError, R>

  delete: (key: string) => Effect.Effect<void, RedisError, never>
  withLock: <A, E, R>(
    program: Effect.Effect<A, E, R>
  ) => (
    resources: string[] | string,
    duration?: Duration.DurationInput
  ) => Effect.Effect<A, E | RedisLockError, R>

  addIntoSortedSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string,
    value: A,
    score: number
  ) => Effect.Effect<void, ParseResult.ParseError | RedisError, R>

  getSortedSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string,
    order: 'asc' | 'desc'
  ) => Effect.Effect<readonly A[], ParseResult.ParseError | RedisError, R>

  clearSortedSet: (key: string) => Effect.Effect<void, RedisError>

  getAndDropSortedSet: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    key: string,
    order: 'asc' | 'desc'
  ) => Effect.Effect<readonly A[], ParseResult.ParseError | RedisError, R>
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
                cause: e,
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

      const setExpiresAt: RedisOperations['setExpiresAt'] = (
        key: string,
        expiresAt: UnixMilliseconds
      ) =>
        Effect.tryPromise({
          try: async () => await redisClient.pexpireat(key, expiresAt),
          catch: (e) => new RedisError({cause: e}),
        }).pipe(
          Effect.filterOrFail(
            (result) => result === 1,
            () => new NoSuchElementException()
          ),
          Effect.asVoid
        )

      const getString = (
        key: string
      ): Effect.Effect<string, RedisError | NoSuchElementException> =>
        Effect.async<string, RedisError | NoSuchElementException>((cb) => {
          void redisClient.get(key, (err, res) => {
            if (err) cb(Effect.fail(new RedisError({cause: err})))
            else if (!res) cb(Effect.fail(new NoSuchElementException()))
            else cb(Effect.succeed(res))
          })
        }).pipe(
          Effect.catchAllDefect((e) =>
            Effect.zipRight(
              Effect.logError('Error while reading reddis', e, key),
              Effect.fail(new RedisError({cause: e}))
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
            if (err) cb(Effect.fail(new RedisError({cause: err})))
            else cb(Effect.succeed(Effect.void))
          })
        }).pipe(
          Effect.catchAllDefect((e) =>
            Effect.zipRight(
              Effect.logError('Error while writing to reddis', e, key),
              Effect.fail(new RedisError({cause: e}))
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
              cb(Effect.fail(new RedisError({cause: err})))
            } else cb(Effect.succeed(Effect.void))
          })
        }).pipe(Effect.withSpan('Redis delete', {attributes: {key}}))

      const insertToSet = (
        key: string,
        value: readonly string[],
        expiresAt?: UnixMilliseconds
      ): Effect.Effect<void, RedisError> => {
        const addToSet = Effect.tryPromise({
          try: async () => {
            await redisClient.sadd(key, ...value)
          },
          catch: (e) => new RedisError({cause: e}),
        })

        const setExpiration =
          expiresAt !== undefined
            ? Effect.tryPromise({
                try: async () => await redisClient.pexpireat(key, expiresAt),
                catch: (e) => new RedisError({cause: e}),
              }).pipe(Effect.asVoid)
            : Effect.void

        return addToSet.pipe(
          Effect.flatMap(() => setExpiration),
          Effect.withSpan('Redis insertToSet', {attributes: {key, expiresAt}})
        )
      }

      const deleteFromSet = (
        key: string,
        value: readonly string[]
      ): Effect.Effect<void, RedisError> => {
        const removeFromSet = Effect.tryPromise({
          try: async () => {
            await redisClient.srem(key, ...value)
          },
          catch: (e) => new RedisError({cause: e}),
        })

        return removeFromSet.pipe(
          Effect.withSpan('Redis deleteFromSet', {attributes: {key}})
        )
      }

      const decodeListResult = Schema.decodeUnknownOption(
        Schema.NullishOr(Schema.Array(Schema.String))
      )

      const isInSet = (
        key: string,
        value: string
      ): Effect.Effect<boolean, RedisError> =>
        Effect.async<boolean, RedisError>((cb) => {
          void redisClient.sismember(key, value, (err, res) => {
            if (err) {
              cb(Effect.fail(new RedisError({cause: err})))
            } else {
              cb(Effect.succeed(res === 1))
            }
          })
        }).pipe(Effect.withSpan('Redis isInSet', {attributes: {key, value}}))

      const getSetMembers = (
        key: string
      ): Effect.Effect<
        Option.Option<NonEmptyReadonlyArray<string>>,
        RedisError
      > =>
        Effect.tryPromise({
          try: async () => await redisClient.smembers(key),
          catch: (e) => new RedisError({cause: e}),
        }).pipe(
          Effect.flatMap((res) => {
            const listData = decodeListResult(res)

            if (Option.isNone(listData)) {
              return Effect.fail(
                new RedisError({
                  cause: new Error('Unable to decode list data'),
                })
              )
            }

            return Effect.succeed(
              listData.value && isNonEmptyReadonlyArray(listData.value)
                ? Option.some(listData.value)
                : Option.none()
            )
          }),
          Effect.withSpan('Redis getSetMembers', {attributes: {key}})
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
                cb(Effect.fail(new RedisError({cause: new Error('No result')})))
                return
              }

              const [listError, listDataUnknown] = listResult
              const listData = decodeListResult(listDataUnknown)

              if (err ?? listError) {
                cb(Effect.fail(new RedisError({cause: err ?? listError})))
              } else if (Option.isNone(listData)) {
                cb(
                  Effect.fail(
                    new RedisError({
                      cause: new Error('Unable to decode list data'),
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

      const addIntoSortedSet = (
        key: string,
        value: string,
        score: number
      ): Effect.Effect<void, RedisError> =>
        Effect.tryPromise({
          try: async () => {
            await redisClient.zadd(key, score, value)
          },
          catch: (e) => new RedisError({cause: e}),
        }).pipe(
          Effect.withSpan('Redis addIntoSortedSet', {attributes: {key, score}})
        )

      const getSortedSet = (
        key: string,
        order: 'asc' | 'desc'
      ): Effect.Effect<string[], RedisError> =>
        Effect.tryPromise({
          try: async () =>
            order === 'asc'
              ? await redisClient.zrange(key, 0, -1)
              : await redisClient.zrevrange(key, 0, -1),
          catch: (e) => new RedisError({cause: e}),
        }).pipe(
          Effect.withSpan('Redis getSortedSet', {attributes: {key, order}})
        )

      const clearSortedSet = (key: string): Effect.Effect<void, RedisError> =>
        Effect.tryPromise({
          try: async () => {
            await redisClient.del(key)
          },
          catch: (e) => new RedisError({cause: e}),
        }).pipe(Effect.withSpan('Redis clearSortedSet', {attributes: {key}}))

      const getAndDropSortedSet = (
        key: string,
        order: 'asc' | 'desc'
      ): Effect.Effect<readonly string[], RedisError> =>
        Effect.tryPromise({
          try: async () => {
            const multi = redisClient.multi()
            if (order === 'asc') {
              multi.zrange(key, 0, -1)
            } else {
              multi.zrevrange(key, 0, -1)
            }
            multi.del(key)
            const res = await multi.exec()

            const listResult = res?.[0]
            if (!listResult) {
              return []
            }

            const [listError, listDataUnknown] = listResult
            if (listError) {
              throw listError
            }

            const listData = decodeListResult(listDataUnknown)
            return Option.isSome(listData) ? (listData.value ?? []) : []
          },
          catch: (e) => new RedisError({cause: e}),
        }).pipe(
          Effect.withSpan('Redis getAndDropSortedSet', {
            attributes: {key, order},
          })
        )

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
        setExpiresAt,
        exists: (key) =>
          Effect.tryPromise({
            try: async () => (await redisClient.exists(key)) === 1,
            catch: (e) => new RedisError({cause: e}),
          }),
        isInSet: (schema) => {
          const encode = Schema.encode(Schema.parseJson(schema))
          return (key, value) =>
            encode(value).pipe(
              Effect.flatMap((encoded) => isInSet(key, encoded))
            )
        },
        insertToSet: (schema) => {
          const encode = Schema.encode(Schema.Array(Schema.parseJson(schema)))
          return (key, values, opts) =>
            encode(values).pipe(
              Effect.flatMap((encoded) =>
                insertToSet(key, encoded, opts?.expiresAt)
              )
            )
        },
        deleteFromSet: (schema) => {
          const encode = Schema.encode(Schema.Array(Schema.parseJson(schema)))
          return (key, values) =>
            encode(values).pipe(
              Effect.flatMap((encoded) => deleteFromSet(key, encoded))
            )
        },
        readAndDeleteSet: (schema) => {
          const decode = Schema.decode(Schema.Array(Schema.parseJson(schema)))
          return (key) =>
            readAndDeleteSet(key).pipe(Effect.flatten, Effect.flatMap(decode))
        },
        getSet: (schema) => {
          const decode = Schema.decode(Schema.Array(Schema.parseJson(schema)))
          return (key) =>
            getSetMembers(key).pipe(
              Effect.flatten,
              Effect.flatMap(decode),
              Effect.filterOrFail(Array.isNonEmptyReadonlyArray)
            )
        },
        delete: deleteKey,
        withLock,
        addIntoSortedSet: (schema) => {
          const encode = Schema.encode(Schema.parseJson(schema))
          return (key, value, score) =>
            encode(value).pipe(
              Effect.flatMap((encoded) => addIntoSortedSet(key, encoded, score))
            )
        },
        getSortedSet: (schema) => {
          const decode = Schema.decode(Schema.Array(Schema.parseJson(schema)))
          return (key, order) =>
            getSortedSet(key, order).pipe(Effect.flatMap(decode))
        },
        clearSortedSet,
        getAndDropSortedSet: (schema) => {
          const decode = Schema.decode(Schema.Array(Schema.parseJson(schema)))
          return (key, order) =>
            getAndDropSortedSet(key, order).pipe(Effect.flatMap(decode))
        },
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

export const withRedisLockFromEffect: <A, E, R, R2>(
  resources: Effect.Effect<string[] | string, never, R2>,
  duration?: Duration.DurationInput
) => (
  program: Effect.Effect<A, E, R>
) => Effect.Effect<A, E | RedisLockError, R | RedisService | R2> =
  (resources, duration) => (program) =>
    Effect.gen(function* (_) {
      const redisService = yield* _(RedisService)
      const resolvedResources = yield* _(resources)
      return yield* _(
        redisService.withLock(program)(resolvedResources, duration)
      )
    })
