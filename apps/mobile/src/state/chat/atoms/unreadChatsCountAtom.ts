import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom} from 'jotai/utils'
import isChatActive from '../utils/isChatActive'
import messagingStateAtom from './messagingStateAtom'

const chatsListAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.elems().prop('chats').elems()
)

export const unreadChatsCountAtom = atom(
  (get) =>
    get(chatsListAtom)
      .filter(isChatActive)
      .filter((chat) => chat.chat.isUnread).length
)

export const areThereUnreadMessagesAtom = selectAtom(chatsListAtom, (chats) =>
  chats.filter(isChatActive).some((one) => one.chat.isUnread)
)
