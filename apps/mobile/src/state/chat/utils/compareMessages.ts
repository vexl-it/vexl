import {type ChatMessageWithState} from '../domain'

function getOrderingTime(message: ChatMessageWithState): number {
  return message.receivedByServerAt ?? message.message.time
}

export default function compareMessages(
  m1: ChatMessageWithState,
  m2: ChatMessageWithState
): -1 | 0 | 1 {
  const timeDifference = getOrderingTime(m1) - getOrderingTime(m2)
  if (timeDifference < 0) return -1
  if (timeDifference > 0) return 1

  const uuidDifference = m1.message.uuid.localeCompare(m2.message.uuid)
  if (uuidDifference < 0) return -1
  if (uuidDifference > 0) return 1
  return 0
}
