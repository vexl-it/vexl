import {DateTime} from 'luxon'
import {type ChatMessageWithState} from '../../state/chat/domain'
import {i18n} from '../../utils/localization/I18nProvider'

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
  let prevMessageTime: DateTime | null = null

  return messages.map((message, i) => {
    const messageTime = DateTime.fromMillis(message.message.time)
    if (
      prevMessageTime &&
      prevMessageTime.diff(messageTime, 'minutes').minutes > 10
    ) {
      return {
        type: 'time',
        time: prevMessageTime,
        key: `time-${prevMessageTime.toString()}`,
      }
    } else if (
      prevMessageTime &&
      prevMessageTime.diff(messageTime, 'minutes').minutes > 1
    ) {
      return {
        type: 'space',
        key: `space-${message.message.uuid}`,
      }
    }
    prevMessageTime = messageTime

    return {
      type: 'message',
      time: messageTime,
      message,
      isLatest: i === messages.length - 1,
      key: `message-${message.message.uuid}`,
    }
  })
}

export function chatTime(dateTime: DateTime): string {
  const now = DateTime.now()
  const dateTimeWithCorrectLocal = dateTime.setLocale(i18n.locale)

  if (dateTime.hasSame(now, 'day')) {
    return dateTime
      .setLocale(i18n.locale)
      .toLocaleString(DateTime.TIME_24_SIMPLE)
  }

  if (dateTime.hasSame(now, 'week')) {
    return dateTimeWithCorrectLocal.toFormat('cccc')
  }

  return dateTime.setLocale(i18n.locale).toLocaleString(DateTime.DATE_FULL)
}
