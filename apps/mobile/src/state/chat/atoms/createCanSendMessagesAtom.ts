import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ChatMessageWithState} from '../domain'

export const createCanSendMessagesAtom = (
  messagesAtom: Atom<ChatMessageWithState[]>
): Atom<boolean> =>
  selectAtom(messagesAtom, (o) => {
    const lastMessage = o.at(-1)

    return !(
      (lastMessage?.state === 'received' &&
        lastMessage.message.messageType === 'INBOX_DELETED') ||
      lastMessage?.message.messageType === 'DELETE_CHAT' ||
      lastMessage?.message.messageType === 'REQUEST_MESSAGING' ||
      lastMessage?.message.messageType === 'CANCEL_REQUEST_MESSAGING' ||
      lastMessage?.message.messageType === 'DISAPPROVE_MESSAGING' ||
      lastMessage?.message.messageType === 'BLOCK_CHAT'
    )
  })
