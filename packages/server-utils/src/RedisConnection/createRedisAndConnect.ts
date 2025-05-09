import {Effect} from 'effect'
import IORedis from 'ioredis'
import {SettingUpRedisConnectionError} from './domain'
import {type ParsedUrl} from './parseUrl'

export const createRedisAndConnect = (
  parsedUrl: ParsedUrl
): Effect.Effect<IORedis, SettingUpRedisConnectionError> =>
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
    Effect.tap((redis) =>
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      Effect.async<void, SettingUpRedisConnectionError>((cb) => {
        const cleanup = (): void => {
          redis.off('error', onError)
          redis.off('ready', onReady)
        }

        const onError = (err: Error): void => {
          cleanup()
          redis.disconnect(false)
          cb(
            Effect.fail(
              new SettingUpRedisConnectionError({
                message: 'Error while connecting to redis',
                cause: err,
              })
            )
          )
        }

        const onReady = (): void => {
          cleanup()
          cb(Effect.void)
        }

        // If already ready, resolve immediately.
        if (redis.status === 'ready') {
          cb(Effect.void)
          return
        }

        redis.on('error', onError)
        redis.on('ready', onReady)
      }).pipe(
        Effect.timeout('10 seconds'),
        Effect.catchTag('TimeoutException', (e) => {
          return Effect.zipRight(
            Effect.sync(() => {
              redis.disconnect(false)
            }),
            new SettingUpRedisConnectionError({
              cause: e,
              message: 'Timeout while connecting to redis',
            })
          )
        })
      )
    )
  )
