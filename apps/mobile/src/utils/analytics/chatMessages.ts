import {type MessageType} from '@vexl-next/domain/src/general/messaging'
import {Array, Option, pipe} from 'effect'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../state/chat/domain'

export function messageTimes(
  messages: readonly ChatMessageWithState[],
  state: 'received' | 'sent',
  messageType: MessageType
): number[] {
  return pipe(
    messages,
    Array.filterMap((one) =>
      one.state !== 'receivedButRequiresNewerVersion' &&
      one.state === state &&
      one.message.messageType === messageType
        ? Option.some(one.message.time)
        : Option.none()
    )
  )
}

export const earliest = (times: readonly number[]): Option.Option<number> =>
  Array.isNonEmptyReadonlyArray(times)
    ? Option.some(Math.min(...times))
    : Option.none()

/** Requests received for one of my offers, over all chats of its inbox. */
export const receivedRequestTimes = (
  chats: readonly ChatWithMessages[]
): number[] =>
  Array.flatMap(chats, (chat) =>
    messageTimes(chat.messages, 'received', 'REQUEST_MESSAGING')
  )

export const bothWrote = (chat: ChatWithMessages): boolean =>
  Array.isNonEmptyArray(messageTimes(chat.messages, 'sent', 'MESSAGE')) &&
  Array.isNonEmptyArray(messageTimes(chat.messages, 'received', 'MESSAGE'))
