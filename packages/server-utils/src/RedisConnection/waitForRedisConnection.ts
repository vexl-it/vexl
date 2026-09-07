import {Effect, type Duration} from 'effect'
import {type TimeoutError} from 'effect/Cause'
import type IORedis from 'ioredis'
import {RedisError} from '../RedisService'

export const waitForRedisConnection =
  (timeout: Duration.Input) =>
  (redis: IORedis): Effect.Effect<IORedis, RedisError | TimeoutError> =>
    Effect.callback<IORedis, RedisError>((cb) => {
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
      Effect.tapErrorTag('TimeoutError', (e) =>
        Effect.sync(() => {
          redis.disconnect(false)
        })
      )
    )
