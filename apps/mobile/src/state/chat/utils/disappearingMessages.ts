import {Array, pipe} from 'effect'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export function isMessageExpired(
  {message}: ChatMessageWithState,
  now: number
): boolean {
  return (
    message.messageType === 'MESSAGE' &&
    !!message.disappearingTimer &&
    message.time + message.disappearingTimer * 1000 <= now
  )
}

export function applyDisappearingTimerUpdate(
  message: ChatMessageWithState | undefined
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (
      !message ||
      message.message.messageType !== 'DISAPPEARING_MESSAGES_UPDATE' ||
      (message.state !== 'sent' && message.state !== 'received')
    )
      return chat

    return {
      ...chat,
      chat: {
        ...chat.chat,
        disappearingTimer: message.message.disappearingTimer,
      },
    }
  }
}

export function splitExpiredMessages(
  chat: ChatWithMessages,
  now: number
): {expired: ChatMessageWithState[]; chat: ChatWithMessages} {
  const [kept, expired] = pipe(
    chat.messages,
    Array.partition((message) => isMessageExpired(message, now))
  )

  return {
    expired,
    chat: Array.isNonEmptyArray(expired) ? {...chat, messages: kept} : chat,
  }
}
