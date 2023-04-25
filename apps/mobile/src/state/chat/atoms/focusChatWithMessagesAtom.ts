import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {
  type ChatIds,
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../domain'
import {focusAtom} from 'jotai-optics'
import messagingStateAtom from './messagingStateAtom'
import {type Chat} from '@vexl-next/domain/dist/general/messaging'

export type ChatWithMessagesAtom = FocusAtomType<ChatWithMessages | undefined>
export default function focusChatWithMessagesAtom({
  chatId,
  inboxKey,
}: ChatIds): ChatWithMessagesAtom {
  return focusAtom(messagingStateAtom, (o) =>
    o
      .find((one) => one.inbox.privateKey.publicKeyPemBase64 === inboxKey)
      .prop('chats')
      .find((one) => one.chat.id === chatId)
  )
}

export type ChatInfAtom = FocusAtomType<Chat | undefined>

export function focusChatInfoAtom(
  chatWithMessagesAtom: ChatWithMessagesAtom
): ChatInfAtom {
  return focusAtom(chatWithMessagesAtom, (o) => o.optional().prop('chat'))
}

export type ChatMessagesAtom = FocusAtomType<ChatMessageWithState[] | undefined>

export function focusChatMessagesAtom(
  chatWithMessagesAtom: ChatWithMessagesAtom
): ChatMessagesAtom {
  return focusAtom(chatWithMessagesAtom, (o) => o.optional().prop('messages'))
}
