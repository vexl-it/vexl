import {
  type Config,
  type ConfigError,
  Context,
  Effect,
  Layer,
  Metric,
  Stream,
} from 'effect'
import type IORedis from 'ioredis'
import {createRedisAndConnect} from './createRedisAndConnect'
import {type SettingUpRedisConnectionError} from './domain'
import {parseUrl} from './parseUrl'
import {redisConnectionChanges} from './redisConnectionChanges'

const RedisConnectionStateGauge = Metric.gauge('redis_connection_state', {
  description: 'Redis connection state. 1 = connected, 0 = disconnected',
})

export class RedisConnectionService extends Context.Tag(
  'RedisConnectionService'
)<RedisConnectionService, IORedis>() {
  static readonly layer = (
    redisUrlConfig: Config.Config<string>
  ): Layer.Layer<
    RedisConnectionService,
    SettingUpRedisConnectionError | ConfigError.ConfigError
  > =>
    Layer.scoped(
      RedisConnectionService,
      Effect.gen(function* (_) {
        const redisUrl = yield* _(redisUrlConfig)
        const redisConnection = yield* _(
          parseUrl(redisUrl),
          Effect.flatMap(createRedisAndConnect)
        )

        yield* _(
          redisConnectionChanges(redisConnection),
          Stream.runForEach((state) =>
            Effect.zip(
              Metric.set(
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
