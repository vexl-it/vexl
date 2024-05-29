import {Schema} from '@effect/schema'

export default class DebugMessage extends Schema.TaggedClass<DebugMessage>(
  'DebugMessage'
)('DebugMessage', {
  message: Schema.String,
}) {}
