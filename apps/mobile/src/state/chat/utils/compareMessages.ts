import {type ChatMessageWithState} from '../domain'

function getOrderingTime(message: ChatMessageWithState): number {
  return message.receivedByServerAt ?? message.message.time
}

/**
 * Messages that are still sending stay at the end. They have no server
 * timestamp yet, and the server stamps them later than everything else.
 */
export default function compareMessages(
  m1: ChatMessageWithState,
  m2: ChatMessageWithState
): -1 | 0 | 1 {
  const isSending1 = m1.state === 'sending'
  const isSending2 = m2.state === 'sending'
  if (isSending1 !== isSending2) return isSending1 ? 1 : -1

  const timeDifference = getOrderingTime(m1) - getOrderingTime(m2)
  if (timeDifference < 0) return -1
  if (timeDifference > 0) return 1

  const uuidDifference = m1.message.uuid.localeCompare(m2.message.uuid)
  if (uuidDifference < 0) return -1
  if (uuidDifference > 0) return 1
  return 0
}
