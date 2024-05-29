import {Schema} from '@effect/schema'
import DebugMessage from './DebugMessage'

export class PingMessage extends Schema.TaggedClass<PingMessage>()(
  'PingMessage',
  {}
) {}

export const ClientMessage = Schema.Union(PingMessage, DebugMessage)
export type ClientMessage = Schema.Schema.Type<typeof ClientMessage>
