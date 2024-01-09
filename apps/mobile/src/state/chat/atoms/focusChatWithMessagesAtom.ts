import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {focusAtom} from 'jotai-optics'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {
  type ChatIds,
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../domain'
import messagingStateAtom from './messagingStateAtom'

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

export function focusChatWithMessagesByKeysAtom({
  otherSideKey,
  inboxKey,
}: {
  inboxKey: PublicKeyPemBase64
  otherSideKey: PublicKeyPemBase64
}): ChatWithMessagesAtom {
  return focusAtom(messagingStateAtom, (o) =>
    o
      .find((one) => one.inbox.privateKey.publicKeyPemBase64 === inboxKey)
      .prop('chats')
      .find((one) => one.chat.otherSide.publicKey === otherSideKey)
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
