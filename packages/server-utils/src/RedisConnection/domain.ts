import {Schema} from 'effect'

export class SettingUpRedisConnectionError extends Schema.TaggedError<SettingUpRedisConnectionError>(
  'SettingUpRedisConnectionError'
)('SettingUpRedisConnectionError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}
