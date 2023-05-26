import {selectAtom} from 'jotai/utils'
import {focusAtom} from 'jotai-optics'
import messagingStateAtom from './messagingStateAtom'

const chatsListAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.elems().prop('chats').elems().prop('chat')
)

const areThereUnreadMessagesAtom = selectAtom(chatsListAtom, (chats) =>
  chats.some((one) => one.isUnread)
)

export default areThereUnreadMessagesAtom
