import {type TimeoutException} from 'effect/Cause'
import {Effect, type Duration} from 'effect/index'
import type IORedis from 'ioredis'
import {RedisError} from '../RedisService'

export const waitForRedisConnection =
  (timeout: Duration.DurationInput) =>
  (redis: IORedis): Effect.Effect<IORedis, RedisError | TimeoutException> =>
    Effect.async<IORedis, RedisError>((cb) => {
      const cleanup = (): void => {
        redis.off('error', onError)
        redis.off('ready', onReady)
      }

      const onError = (err: Error): void => {
        cleanup()
        redis.disconnect(false)
        cb(Effect.fail(new RedisError({cause: err})))
      }

      const onReady = (): void => {
        cleanup()
        cb(Effect.succeed(redis))
      }

      if (redis.status === 'ready') {
        cb(Effect.succeed(redis))
        return
      }

      redis.on('error', onError)
      redis.on('ready', onReady)

      return Effect.sync(() => {
        cleanup()
        redis.disconnect(false)
      })
    }).pipe(
      Effect.timeout(timeout),
      Effect.tapErrorTag('TimeoutException', (e) =>
        Effect.sync(() => {
          redis.disconnect(false)
        })
      )
    )
