import {type ChatMessageWithState} from '../domain'

export default function areMessagesEqual(
  m1: ChatMessageWithState,
  m2: ChatMessageWithState
): boolean {
  return m2.message.uuid === m1.message.uuid
}
