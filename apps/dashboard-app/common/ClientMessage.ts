import {Schema} from 'effect'
import DebugMessage from './DebugMessage'

export class PingMessage extends Schema.TaggedClass<PingMessage>()(
  'PingMessage',
  {}
) {}

export const ClientMessage = Schema.Union(PingMessage, DebugMessage)
export type ClientMessage = Schema.Schema.Type<typeof ClientMessage>
