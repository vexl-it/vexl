import {type ChatWithMessages} from '../domain'

export default function chatShouldBeVisible(chat: ChatWithMessages): boolean {
  if (chat.messages.length === 0) return false

  const lastMessage = chat.messages.at(-1)
  if (!lastMessage) return false

  const lastMessageIsMeDeletingChat =
    lastMessage.message.messageType === 'DELETE_CHAT' &&
    lastMessage.state === 'sent'
  const lastMessageIsMeBlockingChat =
    lastMessage.message.messageType === 'BLOCK_CHAT' &&
    lastMessage.state === 'sent'
  const lastMessageIsMeCancellingRequest =
    lastMessage.message.messageType === 'CANCEL_REQUEST_MESSAGING' &&
    lastMessage.state === 'sent'

  return (
    !lastMessageIsMeBlockingChat &&
    !lastMessageIsMeDeletingChat &&
    !lastMessageIsMeCancellingRequest
  )
}
