import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {
  now,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {atom} from 'jotai'
import addToSortedArray from '../../../utils/addToSortedArray'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import areMessagesEqual from '../utils/areMessagesEqual'
import compareMessages from '../utils/compareMessages'

export const INACTIVITY_REMINDER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * The reminder is inserted at most once per inactivity episode -
 * `inactivityReminderInsertedForMessageTime` tracks the "quiet since" message
 * so a dismissed reminder is not re-added until a newer real message arrives.
 */
export function shouldInsertInactivityReminder(
  chat: ChatWithMessages,
  currentTime: UnixMilliseconds
): boolean {
  const lastMessage = chat.messages.at(-1)
  if (!lastMessage) return false
  if (lastMessage.message.messageType === 'INACTIVITY_REMINDER') return false

  const quietSince = lastMessage.message.time
  if (currentTime - quietSince < INACTIVITY_REMINDER_THRESHOLD_MS) return false

  return chat.chat.inactivityReminderInsertedForMessageTime !== quietSince
}

/**
 * Inserts a local-only `INACTIVITY_REMINDER` message into a chat that has been
 * inactive for {@link INACTIVITY_REMINDER_THRESHOLD_MS}. Never sent to the
 * server or the other side. Returns `true` when a reminder was inserted.
 */
export const insertInactivityReminderActionAtom = atom(
  null,
  (
    get,
    set,
    chatAtom: FocusAtomType<ChatWithMessages | undefined>
  ): boolean => {
    const chat = get(chatAtom)
    if (!chat) return false

    const currentTime = now()
    if (!shouldInsertInactivityReminder(chat, currentTime)) return false

    const lastMessage = chat.messages.at(-1)
    if (!lastMessage) return false
    const quietSince = lastMessage.message.time

    const reminderMessage: ChatMessage = {
      uuid: generateChatMessageId(),
      // never displayed - the bubble and list preview render localized strings
      text: '-',
      messageType: 'INACTIVITY_REMINDER',
      time: currentTime,
      senderPublicKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
    }

    set(chatAtom, (prev) => ({
      ...prev,
      messages: addToSortedArray(
        prev.messages,
        compareMessages,
        areMessagesEqual
      )({
        state: 'sent',
        message: reminderMessage,
      } satisfies ChatMessageWithState),
      chat: {
        ...prev.chat,
        isUnread: true,
        inactivityReminderInsertedForMessageTime: quietSince,
      },
    }))

    return true
  }
)
