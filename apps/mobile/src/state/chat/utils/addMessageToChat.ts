import addToSortedArray from '../../../utils/addToSortedArray'
import compareMessages from './compareMessages'
import areMessagesEqual from './areMessagesEqual'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function addMessageToChat(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    messages: addToSortedArray(
      chat.messages,
      compareMessages,
      areMessagesEqual
    )(message),
  })
}
