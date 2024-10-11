import {Schema} from '@effect/schema'

export class ErrorSettingUpConsumer extends Schema.TaggedError<ErrorSettingUpConsumer>(
  'ErrorSettingUpConsumer'
)('ErrorSettingUpConsumer', {
  message: Schema.String,
  cause: Schema.Unknown,
}) {}
