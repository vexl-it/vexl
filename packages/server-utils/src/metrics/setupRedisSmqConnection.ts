import {Effect, Schema, type Config, type ConfigError} from 'effect'
import {Configuration, type IRedisSMQConfigRequired} from 'redis-smq'
import {ERedisConfigClient} from 'redis-smq-common'

export class SettingUpRedisSmqConnectionError extends Schema.TaggedError<SettingUpRedisSmqConnectionError>(
  'SettingUpRedisSmqConnectionError'
)('SettingUpRedisSmqConnectionError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export const setupRedisSmqConnection = (
  redisUrlConfig: Config.Config<string>
): Effect.Effect<
  IRedisSMQConfigRequired,
  ConfigError.ConfigError | SettingUpRedisSmqConnectionError,
  never
> =>
  redisUrlConfig.pipe(
    Effect.flatMap((redisUrl) =>
      Effect.try({
        try: () =>
          Configuration.getSetConfig({
            redis: {
              client: ERedisConfigClient.REDIS,
              options: {
                url: redisUrl,
              },
            },
          }),
        catch: (e) =>
          new SettingUpRedisSmqConnectionError({
            message: 'Error while setting up redis-smq configuration',
            cause: e,
          }),
      })
    )
  )
