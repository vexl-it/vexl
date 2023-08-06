import {focusAtom} from 'jotai-optics'
import messagingStateAtom from './messagingStateAtom'
import {selectAtom} from 'jotai/utils'
import {atom} from 'jotai'

const chatsListAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.elems().prop('chats').elems().prop('chat')
)

export const unreadChatsCountAtom = atom(
  (get) => get(chatsListAtom).filter((chat) => chat.isUnread).length,
  (get) => {
    const chats = get(chatsListAtom)

    return chats.filter((chat) => chat.isUnread).length
  }
)

unreadChatsCountAtom.onMount = (setAtom) => {
  setAtom()
}

export const areThereUnreadMessagesAtom = selectAtom(chatsListAtom, (chats) =>
  chats.some((one) => one.isUnread)
)
