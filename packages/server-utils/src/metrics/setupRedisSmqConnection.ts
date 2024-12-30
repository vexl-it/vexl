import {Effect, Schema, type Config, type ConfigError} from 'effect'
import {Configuration, type IRedisSMQConfigRequired} from 'redis-smq'
import {ERedisConfigClient} from 'redis-smq-common'

export class SettingUpRedisSmqConnectionError extends Schema.TaggedError<SettingUpRedisSmqConnectionError>(
  'SettingUpRedisSmqConnectionError'
)('SettingUpRedisSmqConnectionError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

const ParsedUrl = Schema.Struct({
  scheme: Schema.optional(Schema.String),
  username: Schema.optional(Schema.String),
  password: Schema.optional(Schema.String),
  hostname: Schema.optional(Schema.String),
  port: Schema.optionalWith(Schema.NumberFromString, {default: () => 6379}),
})

const parseUrl = (
  urlString: string
): Effect.Effect<typeof ParsedUrl.Type, SettingUpRedisSmqConnectionError> =>
  Effect.try({
    try: () => {
      const url = new URL(urlString)
      return Schema.decodeSync(ParsedUrl)({
        scheme: url.protocol.replace(':', ''),
        username: url.username,
        password: url.password,
        hostname: url.hostname,
        port: url.port,
      })
    },
    catch: (e) =>
      new SettingUpRedisSmqConnectionError({
        message: 'Error while parsing redis url',
        cause: e,
      }),
  })

export const setupRedisSmqConnection = (
  redisUrlConfig: Config.Config<string>
): Effect.Effect<
  IRedisSMQConfigRequired,
  ConfigError.ConfigError | SettingUpRedisSmqConnectionError,
  never
> =>
  redisUrlConfig.pipe(
    Effect.flatMap(parseUrl),
    Effect.tap((url) => Effect.log('Connecting to redis', url)),
    Effect.flatMap((redisUrl) =>
      Effect.try({
        try: () => {
          return Configuration.getSetConfig({
            redis: {
              client: ERedisConfigClient.IOREDIS,
              options: {
                port: redisUrl.port,
                host: redisUrl.hostname,
                password: redisUrl.password,
                username: redisUrl.username,
              },
            },
          })
        },
        catch: (e) =>
          new SettingUpRedisSmqConnectionError({
            message: 'Error while setting up redis-smq configuration',
            cause: e,
          }),
      })
    )
  )
