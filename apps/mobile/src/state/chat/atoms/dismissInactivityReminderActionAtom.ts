import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatWithMessages} from '../domain'

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
