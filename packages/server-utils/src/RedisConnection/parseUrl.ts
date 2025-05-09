import {Effect, Schema} from 'effect'
import {SettingUpRedisConnectionError} from './domain'

const ParsedUrl = Schema.Struct({
  scheme: Schema.optional(Schema.String),
  username: Schema.optional(Schema.String),
  password: Schema.optional(Schema.String),
  hostname: Schema.optional(Schema.String),
  port: Schema.optionalWith(Schema.NumberFromString, {default: () => 6379}),
})
export type ParsedUrl = typeof ParsedUrl.Type

export const parseUrl = (
  urlString: string
): Effect.Effect<ParsedUrl, SettingUpRedisConnectionError> =>
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
      new SettingUpRedisConnectionError({
        message: 'Error while parsing redis url',
        cause: e,
      }),
  })
