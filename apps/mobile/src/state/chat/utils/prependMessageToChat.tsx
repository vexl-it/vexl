import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function prependMessageToChat(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    messages: [message, ...chat.messages],
  })
}
