import {type DisappearingTimerSeconds} from '@vexl-next/domain/src/general/messaging'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Option, Schema, pipe} from 'effect'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {getOrderingTime} from './compareMessages'

export const MINIMAL_VERSION_SUPPORTING_DISAPPEARING_MESSAGES =
  Schema.decodeSync(VersionString)('26.9.4')

export function isMessageExpired(
  messageWithState: ChatMessageWithState,
  now: number
): boolean {
  const {message} = messageWithState
  return (
    message.messageType === 'MESSAGE' &&
    !!message.disappearingTimer &&
    getOrderingTime(messageWithState) + message.disappearingTimer * 1000 <= now
  )
}

function getDeliveredTimerUpdate({
  message,
  state,
}: ChatMessageWithState): Option.Option<DisappearingTimerSeconds | undefined> {
  return message.messageType === 'DISAPPEARING_MESSAGES_UPDATE' &&
    (state === 'sent' || state === 'received')
    ? Option.some(message.disappearingTimer)
    : Option.none()
}

// Messages are ordered by server time, so both sides settle on the same update
export function applyLatestDisappearingTimerUpdate(
  chat: ChatWithMessages
): ChatWithMessages {
  return pipe(
    chat.messages,
    Array.findLast(getDeliveredTimerUpdate),
    Option.match({
      onNone: () => chat,
      onSome: (disappearingTimer) => ({
        ...chat,
        chat: {...chat.chat, disappearingTimer},
      }),
    })
  )
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
