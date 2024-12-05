import {DateTime} from 'luxon'
import unixMillisecondsToLocaleDateTime from '../../../utils/unixMillisecondsToLocaleDateTime'
import {type ChatWithMessages, type RequestState} from '../domain'

export function getRequestState(chat?: ChatWithMessages): RequestState {
  const lastMessage = chat?.messages.at(-1)

  if (!lastMessage) return 'initial'
  const lastMessageType = lastMessage.message.messageType

  if (lastMessageType === 'REQUEST_MESSAGING') {
    return 'requested'
  }

  if (lastMessageType === 'CANCEL_REQUEST_MESSAGING') {
    return 'cancelled'
  }

  if (lastMessageType === 'DISAPPROVE_MESSAGING') {
    return 'denied'
  }

  if (lastMessageType === 'DELETE_CHAT') {
    if (lastMessage.state === 'sent') {
      return 'deleted'
    } else {
      return 'otherSideLeft'
    }
  }

  return 'accepted'
}

export function canChatBeRequested(
  chat: ChatWithMessages,
  limitDays: number
):
  | {canBeRerequested: true}
  | {canBeRerequested: false; possibleInDays?: number} {
  if (chat.chat.origin.type === 'myOffer') return {canBeRerequested: false}

  const lastMessage = chat.messages.at(-1)
  if (
    lastMessage?.message.messageType === 'DISAPPROVE_MESSAGING' ||
    lastMessage?.message.messageType === 'REQUEST_MESSAGING' ||
    lastMessage?.message.messageType === 'CANCEL_REQUEST_MESSAGING' ||
    lastMessage?.message.messageType === 'DELETE_CHAT'
  ) {
    const now = DateTime.now().startOf('day')
    const lastMessageAt = unixMillisecondsToLocaleDateTime(
      lastMessage.message.time
    ).startOf('day')
    const diff = now.diff(lastMessageAt, 'days').toObject().days ?? 0
    const canBeRerequested = diff >= limitDays
    if (canBeRerequested) return {canBeRerequested: true}

    return {canBeRerequested: false, possibleInDays: limitDays - diff}
  }

  return {canBeRerequested: false}
}
