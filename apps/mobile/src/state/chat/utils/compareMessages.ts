import {type ChatMessageWithState} from '../domain'

export default function compareMessages(
  m1: ChatMessageWithState,
  m2: ChatMessageWithState
): number {
  return m1.message.time - m2.message.time
}
