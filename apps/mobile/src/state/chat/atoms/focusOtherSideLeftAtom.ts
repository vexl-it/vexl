import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ChatWithMessages} from '../domain'

export default function focusOtherSideLeftAtom(
  chatAtom: Atom<ChatWithMessages>
): Atom<boolean> {
  return selectAtom(chatAtom, (chat) => {
    const lastMessage = chat.messages.at(-1)
    if (!lastMessage) return false

    return (
      lastMessage.state === 'received' &&
      lastMessage.message.messageType === 'DELETE_CHAT'
    )
  })
}
