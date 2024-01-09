import {type ChatId} from '@vexl-next/domain/src/general/messaging'
import focusChatWithMessagesAtom from './focusChatWithMessagesAtom'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {selectAtom} from 'jotai/utils'
import {type Atom} from 'jotai'

export type ChatStatus = 'requested' | 'denied' | 'accepted'

export default function createChatStatusAtom(
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64
): Atom<ChatStatus | null> {
  const chatAtom = focusChatWithMessagesAtom({chatId, inboxKey})

  return selectAtom(chatAtom, (chat) => {
    if (!chat) return null

    const lastMessage = chat.messages.at(-1)
    if (!lastMessage) return null
    if (lastMessage.message.messageType === 'REQUEST_MESSAGING')
      return 'requested'
    if (lastMessage.message.messageType === 'DISAPPROVE_MESSAGING')
      return 'denied'
    return 'accepted'
  })
}
