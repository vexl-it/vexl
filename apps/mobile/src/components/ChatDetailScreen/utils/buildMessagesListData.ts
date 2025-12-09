import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, pipe} from 'effect'
import {type DateTime} from 'luxon'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import unixMillisecondsToLocaleDateTime from '../../../utils/unixMillisecondsToLocaleDateTime'
import {type MessagesListItem} from '../components/MessageItem'
import {
  getMessageTime,
  getUniqueKey,
  type MessageWithState,
} from './VexlBotMessageOrMessageWithState'

function messagesToListData(messages: MessageWithState[]): MessagesListItem[] {
  const result = [] as MessagesListItem[]

  let prevMessageTime: DateTime | null = null

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message) continue
    const messageTime = unixMillisecondsToLocaleDateTime(
      getMessageTime(message)
    )

    const minutesDiff = prevMessageTime
      ? messageTime.diff(prevMessageTime, 'minutes').minutes
      : 0

    if (prevMessageTime && minutesDiff > 10) {
      result.push({
        type: 'time',
        time: prevMessageTime,
        key: `time-${getUniqueKey(message)}`,
      })
      prevMessageTime = messageTime
    } else if (prevMessageTime && minutesDiff > 1) {
      result.push({
        type: 'space',
        key: `space-${getUniqueKey(message)}`,
      })
    }
    prevMessageTime = messageTime

    result.push({
      type: 'message',
      time: messageTime,
      message: message.message,
      isLatest: i === 0,
      key: `message-${getUniqueKey(message)}`,
    })
  }

  const vexlBotTradingChecklistMessage: MessagesListItem = {
    type: 'vexlBot',
    key: 'vexlBot-tradeChecklistReminder',
    data: {
      type: 'tradeChecklistSuggestion',
      date: UnixMilliseconds0,
    },
  }

  // Vexl bot should be displayed after the approve message
  const acceptMessageIndex = result.findIndex(
    (one) =>
      one.type === 'message' &&
      one.message.message.messageType === 'APPROVE_MESSAGING'
  )

  if (acceptMessageIndex === -1) return result
  return [
    ...result.slice(0, acceptMessageIndex),
    vexlBotTradingChecklistMessage,
    ...result.slice(acceptMessageIndex),
  ]
}

export default function buildMessagesListData(
  messages: ChatMessageWithState[]
): MessagesListItem[] {
  return pipe(
    messages,
    Array.map(
      (message): MessageWithState => ({
        type: 'message',
        message,
      })
    ),
    Array.reverse,
    messagesToListData
  )
}
