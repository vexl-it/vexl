import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatWithMessages} from '../domain'

/**
 * Removes a local `INACTIVITY_REMINDER` message from a chat when the user
 * dismisses it. The reminder is dropped from the thread so the chat is no
 * longer pinned to the top of the list. It is NOT re-inserted for the same
 * inactivity episode thanks to `inactivityReminderInsertedForMessageTime`,
 * which was set on the chat when the reminder was inserted.
 */
export const dismissInactivityReminderActionAtom = atom(
  null,
  (
    get,
    set,
    {
      chatAtom,
      messageId,
    }: {
      chatAtom: FocusAtomType<ChatWithMessages | undefined>
      messageId: ChatMessageId
    }
  ): void => {
    const chat = get(chatAtom)
    if (!chat) return

    set(chatAtom, (prev) => ({
      ...prev,
      messages: pipe(
        prev.messages,
        Array.filter((one) => one.message.uuid !== messageId)
      ),
    }))
  }
)
