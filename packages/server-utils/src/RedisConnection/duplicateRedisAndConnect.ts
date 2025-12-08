import {Effect, flow, type Scope} from 'effect'
import type IORedis from 'ioredis'
import {SettingUpRedisConnectionError} from './domain'
import {waitForRedisConnection} from './waitForRedisConnection'

export const duplicateRedisAndConnect = (
  redisInstance: IORedis
): Effect.Effect<IORedis, SettingUpRedisConnectionError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => redisInstance.duplicate()).pipe(
      Effect.flatMap(
        flow(
          waitForRedisConnection('10 seconds'),
          Effect.catchAll(
            (e) =>
              new SettingUpRedisConnectionError({
                message:
                  'Error while connecting to redis - while waiting for connection to be ready',
                cause: e,
              })
          )
        )
      ),
      Effect.tap((connection) =>
        Effect.logInfo('Duplicated Redis connection established', {
          status: connection.status,
        })
      )
    ),
    (redisConnection) =>
      Effect.zip(
        Effect.sync(async () => {
          redisConnection.disconnect(false)
        }).pipe(Effect.exit, Effect.ignore),
        Effect.log('Redis connection closed')
      )
  )
