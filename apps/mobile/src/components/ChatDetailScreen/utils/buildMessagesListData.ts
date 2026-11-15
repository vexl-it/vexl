import {Array, HashSet, Option, pipe} from 'effect'
import {type DateTime} from 'luxon'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../../state/chat/domain'
import {type TradeChecklistInState} from '../../../state/tradeChecklist/domain'
import {isRevealMessageWithoutCard} from '../../../state/tradeChecklist/utils/exchangeDetails'
import {
  isFriendCheckMessage,
  type FriendCheck,
} from '../../../state/tradeChecklist/utils/friendCheck'
import unixMillisecondsToLocaleDateTime from '../../../utils/unixMillisecondsToLocaleDateTime'
import {type TradingChecklistSuggestion} from '../components/VexlbotMessageItem/domain'
import {
  getMessageTime,
  getUniqueKey,
  type MessageWithState,
} from './VexlBotMessageOrMessageWithState'

export type MessagesListItem =
  | {
      type: 'time'
      time: DateTime
      key: string
    }
  | {
      type: 'message'
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
  | {
      type: 'restoredDivider'
      key: string
    }
  | {
      type: 'friendCheckPrompt'
      key: string
    }

const FRIEND_CHECK_PROMPT: MessagesListItem = {
  type: 'friendCheckPrompt',
  key: 'friendCheckPrompt',
}

function isRestored(message: ChatMessageWithState): boolean {
  return (
    (message.state === 'received' || message.state === 'sent') &&
    !!message.restored
  )
}

function messagesToListData(
  messages: MessageWithState[],
  lastRestoredMessageKey: string | undefined
): MessagesListItem[] {
  const result = [] as MessagesListItem[]

  let prevMessageMillis: number | null = null

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message) continue
    const messageMillis = getMessageTime(message)
    const timeItem: () => MessagesListItem = () => ({
      type: 'time',
      time: unixMillisecondsToLocaleDateTime(messageMillis),
      key: `time-${getUniqueKey(message)}`,
    })

    if (i === messages.length - 1) result.push(timeItem())

    const minutesDiff =
      prevMessageMillis === null
        ? 0
        : (messageMillis - prevMessageMillis) / 60_000

    if (minutesDiff > 10) {
      result.push(timeItem())
    } else if (minutesDiff > 1) {
      result.push({
        type: 'space',
        key: `space-${getUniqueKey(message)}`,
      })
    }
    prevMessageMillis = messageMillis

    result.push({
      type: 'message',
      message: message.message,
      isLatest: i === 0,
      key: `message-${getUniqueKey(message)}`,
    })

    if (getUniqueKey(message) === lastRestoredMessageKey) {
      result.push({type: 'restoredDivider', key: 'restoredDivider'})
    }
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
  tradeChecklist: TradeChecklistInState,
  friendChecks: readonly FriendCheck[]
): MessagesListItem[] {
  const friendCheckCards = new Set(
    Array.map(friendChecks, (check) => check.requestMessageId)
  )
  const visibleMessages = pipe(
    messages,
    Array.filter(filterHiddenMessagesIds(hiddenMessagesIds)),
    Array.filter(
      (message) =>
        !isRevealMessageWithoutCard({messages, tradeChecklist}, message)
    ),
    // A friend check is one card that changes as the check goes on
    Array.filter(
      (message) =>
        !isFriendCheckMessage(message) ||
        friendCheckCards.has(message.message.uuid)
    ),
    Array.map(
      (message): MessageWithState => ({
        type: 'message',
        message,
      })
    )
  )
  const lastRestoredMessageKey = pipe(
    visibleMessages,
    Array.findLast((one) => isRestored(one.message)),
    Option.map(getUniqueKey),
    Option.getOrUndefined
  )

  return withFriendCheckPrompt(
    messagesToListData(Array.reverse(visibleMessages), lastRestoredMessageKey),
    messages,
    visibleMessages
  )
}

// The prompt belongs right after the chat was opened. The message that opened
// it can be hidden, so the prompt is placed before the next visible message.
function withFriendCheckPrompt(
  items: MessagesListItem[],
  messages: ChatMessageWithState[],
  visibleMessages: MessageWithState[]
): MessagesListItem[] {
  const visibleKeys = new Set(Array.map(visibleMessages, getUniqueKey))

  return pipe(
    messages,
    Array.findFirstIndex(
      (one) => one.message.messageType === 'APPROVE_MESSAGING'
    ),
    Option.map((chatOpenedIndex) =>
      pipe(
        Array.drop(messages, chatOpenedIndex + 1),
        Array.findFirst((one) => visibleKeys.has(one.message.uuid)),
        Option.flatMap((next) =>
          Array.findFirstIndex(items, (item) =>
            item.key.endsWith(`-${next.message.uuid}`)
          )
        ),
        // The last item is the typing indicator
        Option.getOrElse(() => items.length - 1)
      )
    ),
    Option.flatMap((index) =>
      Array.insertAt(items, index, FRIEND_CHECK_PROMPT)
    ),
    Option.getOrElse(() => items)
  )
}
