import {Schema} from 'effect'

export default class DebugMessage extends Schema.TaggedClass<DebugMessage>(
  'DebugMessage'
)('DebugMessage', {
  message: Schema.String,
}) {}
