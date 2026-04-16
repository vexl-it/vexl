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
import filterIrrelevantIdentityOrContactMessages from './filterIrrelevantIdentityOrContactMessages'

function messagesToListData(messages: MessageWithState[]): MessagesListItem[] {
  const result = [] as MessagesListItem[]

  let prevMessageTime: DateTime | null = null

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message) continue
    const messageTime = unixMillisecondsToLocaleDateTime(
      getMessageTime(message)
    )

    if (i === messages.length - 1) {
      result.push({
        type: 'time',
        time: messageTime,
        key: `time-${getUniqueKey(message)}`,
      })
    }

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

  return [...result, {type: 'typingIndicator', key: 'typingIndicator'}]
}

export default function buildMessagesListData(
  messages: ChatMessageWithState[]
): MessagesListItem[] {
  return pipe(
    messages,
    Array.filter(filterIrrelevantIdentityOrContactMessages(messages)),
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
