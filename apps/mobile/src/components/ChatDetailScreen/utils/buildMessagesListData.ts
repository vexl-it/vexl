import {Array, HashSet, pipe} from 'effect'
import {type DateTime} from 'luxon'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../../state/chat/domain'
import {type TradeChecklistInState} from '../../../state/tradeChecklist/domain'
import unixMillisecondsToLocaleDateTime from '../../../utils/unixMillisecondsToLocaleDateTime'
import {type TradingChecklistSuggestion} from '../components/VexlbotMessageItem/domain'
import {
  getMessageTime,
  getUniqueKey,
  type MessageWithState,
} from './VexlBotMessageOrMessageWithState'
import filterIrrelevantIdentityOrContactMessages from './filterIrrelevantIdentityOrContactMessages'

export type MessagesListItem =
  | {
      type: 'time'
      time: DateTime
      key: string
    }
  | {
      type: 'message'
      time: DateTime
      message: ChatMessageWithState
      isLatest: boolean
      key: string
    }
  | {
      type: 'space'
      key: string
    }
  | {
      type: 'originInfo'
      key: string
    }
  | {
      type: 'vexlBot'
      key: string
      data: TradingChecklistSuggestion
    }
  | {
      type: 'typingIndicator'
      key: string
    }

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
        time: messageTime,
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

const filterHiddenMessagesIds =
  (hiddenMessagesIds: ChatWithMessages['hiddenMessagesIds']) =>
  (message: ChatMessageWithState) => {
    return !HashSet.has(hiddenMessagesIds, message.message.uuid)
  }

export default function buildMessagesListData(
  messages: ChatMessageWithState[],
  hiddenMessagesIds: ChatWithMessages['hiddenMessagesIds'],
  tradeChecklist: TradeChecklistInState
): MessagesListItem[] {
  return pipe(
    messages,
    Array.filter(filterHiddenMessagesIds(hiddenMessagesIds)),
    Array.filter(
      filterIrrelevantIdentityOrContactMessages(messages, tradeChecklist)
    ),
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
