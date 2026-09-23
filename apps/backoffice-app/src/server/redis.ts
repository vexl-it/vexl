import {Config, Effect, Option, Schema} from 'effect'
import Redis from 'ioredis'

export class RedisError extends Schema.TaggedError<RedisError>('RedisError')(
  'RedisError',
  {
    cause: Schema.Unknown,
  }
) {}

// Redis is optional: without REDIS_URL every cache call is a no-op miss.
const redisUrlConfig = Config.option(Config.string('REDIS_URL'))

const client: Option.Option<Redis> = Effect.runSync(redisUrlConfig).pipe(
  Option.map(
    (url) =>
      // Commands wait for the connection but fail fast once Redis is down,
      // so a redirect is never stalled by the cache.
      new Redis(url, {
        maxRetriesPerRequest: 1,
        commandTimeout: 1000,
      })
  )
)

const withClient = <A>(
  onMissing: A,
  run: (redis: Redis) => Promise<A>
): Effect.Effect<A, RedisError> =>
  Option.match(client, {
    onNone: () => Effect.succeed(onMissing),
    onSome: (redis) =>
      Effect.tryPromise({
        try: async () => await run(redis),
        catch: (cause) => new RedisError({cause}),
      }),
  })

export const redisGet = (
  key: string
): Effect.Effect<string | null, RedisError> =>
  withClient(null, async (redis) => await redis.get(key))

export const redisSetWithTtl = (
  key: string,
  value: string,
  ttlSeconds: number
): Effect.Effect<void, RedisError> =>
  withClient(undefined, async (redis) => {
    await redis.set(key, value, 'EX', ttlSeconds)
  })

export const redisDelete = (key: string): Effect.Effect<void, RedisError> =>
  withClient(undefined, async (redis) => {
    await redis.del(key)
  })
