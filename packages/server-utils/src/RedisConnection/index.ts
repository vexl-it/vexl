import {type Config, Context, Effect, Layer, Metric, pipe, Stream} from 'effect'
import type IORedis from 'ioredis'
import {createRedisAndConnect} from './createRedisAndConnect'
import {type SettingUpRedisConnectionError} from './domain'
import {parseUrl} from './parseUrl'
import {redisConnectionChanges} from './redisConnectionChanges'

const RedisConnectionStateGauge = Metric.gauge('redis_connection_state', {
  description: 'Redis connection state. 1 = connected, 0 = disconnected',
})

export class RedisConnectionService extends Context.Service<
  RedisConnectionService,
  IORedis
>()('RedisConnectionService') {
  static readonly layer = (
    redisUrlConfig: Config.Config<string>
  ): Layer.Layer<
    RedisConnectionService,
    SettingUpRedisConnectionError | Config.ConfigError
  > =>
    Layer.effect(
      RedisConnectionService,
      Effect.gen(function* () {
        const redisUrl = yield* redisUrlConfig
        const redisConnection = yield* pipe(
          parseUrl(redisUrl),
          Effect.flatMap(createRedisAndConnect)
        )

        yield* pipe(
          redisConnectionChanges(redisConnection),
          Stream.runForEach((state) =>
            Effect.zip(
              Metric.update(
                RedisConnectionStateGauge,
                state.event === 'ready' ? 1 : 0
              ),
              Effect.logInfo('Redis connection state changed', state)
            )
          ),
          Effect.forkScoped
        )

        return redisConnection
      })
    )
}
