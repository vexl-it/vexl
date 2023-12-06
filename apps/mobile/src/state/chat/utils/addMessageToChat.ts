import addToSortedArray from '../../../utils/addToSortedArray'
import compareMessages from './compareMessages'
import areMessagesEqual from './areMessagesEqual'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function addMessageToChat(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    messages: addMessageToMessagesArray(chat.messages)(message),
  })
}

export function addMessageToMessagesArray(
  messages: ChatMessageWithState[]
): (args: ChatMessageWithState) => ChatMessageWithState[] {
  return (message) =>
    addToSortedArray(messages, compareMessages, areMessagesEqual)(message)
}
