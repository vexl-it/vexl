import {Array} from 'effect'
import {flow} from 'fp-ts/lib/function'
import addToSortedArray from '../../../utils/addToSortedArray'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import areMessagesEqual from './areMessagesEqual'
import compareMessages from './compareMessages'
import {isMetadataMessageType} from './isMetadataMessage'

function updateChatVersion(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (!message.message.myVersion) return chat

    switch (message.state) {
      case 'received':
      case 'receivedButRequiresNewerVersion':
        return {
          ...chat,
          chat: {
            ...chat.chat,
            otherSideVersion:
              message.message?.myVersion ?? chat.chat.otherSideVersion,
          },
        }
      case 'sending':
      case 'sendingError':
      case 'sent':
        return {
          ...chat,
          chat: {
            ...chat.chat,
            lastReportedVersion:
              message.message?.myVersion ?? chat.chat.lastReportedVersion,
          },
        }
    }
  }
}

function updateFcmToken(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (message.state === 'received') {
      return {
        ...chat,
        chat: {
          ...chat.chat,
          otherSideFcmCypher:
            message.message.myVexlToken ?? message.message.myFcmCypher,
          otherSideVexlToken: message.message.myVexlToken,
        },
      }
    }
    return chat
  }
}

function markLastMessageAsNotReadByOtherSide(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (
      message.state === 'sent' &&
      !isMetadataMessageType(message.message.messageType)
    ) {
      return {
        ...chat,
        chat: {
          ...chat.chat,
          lastMessageReadByOtherSideAt: undefined,
        },
      }
    }
    return chat
  }
}

export default function addMessageToChat(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return flow(
    (chat) =>
      isMetadataMessageType(message.message.messageType)
        ? chat
        : ({
            ...chat,
            messages: addMessageToMessagesArray(chat.messages)(message),
          } satisfies ChatWithMessages),
    markLastMessageAsNotReadByOtherSide(message),
    updateChatVersion(message),
    updateFcmToken(message)
  )
}

export function addMessagesToChat(
  messages: ChatMessageWithState[]
): (chat: ChatWithMessages) => ChatWithMessages {
  return flow(
    (chat) =>
      ({
        ...chat,
        messages: Array.appendAll(
          chat.messages,
          Array.sort(messages, compareMessages)
        ),
      }) satisfies ChatWithMessages,
    (chat) => (messages[0] ? updateChatVersion(messages[0])(chat) : chat),
    (chat) => (messages[0] ? updateFcmToken(messages[0])(chat) : chat)
  )
}

function addMessageToMessagesArray(
  messages: ChatMessageWithState[]
): (args: ChatMessageWithState) => ChatMessageWithState[] {
  return (message) =>
    addToSortedArray(messages, compareMessages, areMessagesEqual)(message)
}
