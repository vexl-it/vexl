import {Effect, flow, type Scope} from 'effect'
import IORedis from 'ioredis'
import {SettingUpRedisConnectionError} from './domain'
import {type ParsedUrl} from './parseUrl'
import {waitForRedisConnection} from './waitForRedisConnection'

export const createRedisAndConnect = (
  parsedUrl: ParsedUrl
): Effect.Effect<IORedis, SettingUpRedisConnectionError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.try({
      try: () =>
        new IORedis({
          host: parsedUrl.hostname,
          port: parsedUrl.port,
          password: parsedUrl.password,
          username: parsedUrl.username,
          db: 0, // TODO maybe make this configurable
          maxRetriesPerRequest: null,
        }),
      catch: (e) =>
        new SettingUpRedisConnectionError({
          message: 'Error while setting up redis connection',
          cause: e,
        }),
    }).pipe(
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
        Effect.logInfo('Redis connection established', {
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
