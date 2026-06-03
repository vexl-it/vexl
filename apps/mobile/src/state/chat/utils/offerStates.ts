import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {DateTime} from 'luxon'
import {isOfferExpired} from '../../../utils/isOfferExpired'
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

export function shouldUseGrayscaleColours({
  chat,
  isMine,
  offerInfo,
  rerequestLimitDays,
}: {
  chat?: ChatWithMessages
  isMine: boolean
  offerInfo: OfferInfo
  rerequestLimitDays: number
}): boolean {
  const requestState = getRequestState(chat)
  const canBeRequested = chat
    ? canChatBeRequested(chat, rerequestLimitDays).canBeRerequested
    : true

  if (!offerInfo.publicPart.active) return true
  if (isOfferExpired(offerInfo.publicPart.expirationDate)) return true
  if (isMine || requestState === 'initial') return false
  if (requestState === 'requested') return true
  if (requestState === 'accepted') return true
  if (requestState === 'otherSideLeft') return true

  return !canBeRequested
}

export type ChatState =
  | 'requestedByMe'
  | 'requestedByThem'
  | 'requestDeniedByThem'
  | 'requestDeniedByMe'
  | 'requestCancelledByMe'
  | 'requestCancelledByThem'
  | 'chatOpen' // Chat was opened and is currently open
  | 'chatClosed' // Chat was opened and then got closed

function isMessageFromMe(
  message: ChatWithMessages['messages'][number]
): boolean {
  return (
    message.state === 'sent' ||
    message.state === 'sending' ||
    message.state === 'sendingError'
  )
}

export function getChatState(chat?: ChatWithMessages): ChatState {
  for (let index = chat?.messages.length ?? 0; index > 0; index -= 1) {
    const messageWithState = chat?.messages[index - 1]
    if (!messageWithState) continue

    const messageType = messageWithState.message.messageType

    if (messageType === 'APPROVE_MESSAGING') {
      return 'chatOpen'
    }

    if (
      messageType === 'DELETE_CHAT' ||
      messageType === 'BLOCK_CHAT' ||
      messageType === 'INBOX_DELETED'
    ) {
      return 'chatClosed'
    }

    if (messageType === 'REQUEST_MESSAGING') {
      return isMessageFromMe(messageWithState)
        ? 'requestedByMe'
        : 'requestedByThem'
    }

    if (messageType === 'DISAPPROVE_MESSAGING') {
      return isMessageFromMe(messageWithState)
        ? 'requestDeniedByMe'
        : 'requestDeniedByThem'
    }

    if (messageType === 'CANCEL_REQUEST_MESSAGING') {
      return isMessageFromMe(messageWithState)
        ? 'requestCancelledByMe'
        : 'requestCancelledByThem'
    }
  }

  return 'chatClosed'
}
