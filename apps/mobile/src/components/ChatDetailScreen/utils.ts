import {type ChatMessageWithState} from '../../state/chat/domain'
import {DateTime} from 'luxon'
import i18n from '../../utils/localization/i18n'

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

export function messagesToListData(
  messages: ChatMessageWithState[]
): MessagesListItem[] {
  const result = [] as MessagesListItem[]

  let prevMessageTime: DateTime | null = null

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const messageTime = DateTime.fromMillis(message.message.time)
    if (
      prevMessageTime &&
      prevMessageTime.diff(messageTime, 'minutes').minutes > 10
    ) {
      result.push({
        type: 'time',
        time: prevMessageTime,
        key: `time-${prevMessageTime.toString()}`,
      })
      prevMessageTime = messageTime
    } else if (
      prevMessageTime &&
      prevMessageTime.diff(messageTime, 'minutes').minutes > 1
    ) {
      result.push({
        type: 'space',
        key: `space-${message.message.uuid}`,
      })
    }
    prevMessageTime = messageTime

    result.push({
      type: 'message',
      time: messageTime,
      message,
      isLatest: i === messages.length - 1,
      key: `message-${message.message.uuid}`,
    })
  }

  return result
}

export function chatTime(dateTime: DateTime): string {
  const now = DateTime.now()
  const dateTimeWithCorrectLocal = dateTime.setLocale(i18n.locale)

  if (dateTime.hasSame(now, 'day')) {
    return dateTime.toLocaleString(DateTime.TIME_24_SIMPLE)
  }

  if (dateTime.hasSame(now, 'week')) {
    return dateTimeWithCorrectLocal.toFormat('cccc')
  }

  return dateTime.toLocaleString(DateTime.DATE_FULL)
}
