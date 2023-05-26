import {focusAtom} from 'jotai-optics'
import messagingStateAtom from './messagingStateAtom'

const allChatsAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.elems().prop('chats')
)

export default allChatsAtom
