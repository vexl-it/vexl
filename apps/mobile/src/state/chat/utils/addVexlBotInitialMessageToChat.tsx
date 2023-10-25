import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function addVexlBotInitialMessageToChat(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    messages: [message, ...chat.messages],
  })
}
