import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import addToSortedArray from '../../../utils/addToSortedArray'
import compareMessages from './compareMessages'
import areMessagesEqual from './areMessagesEqual'
import * as O from 'optics-ts'
import {type UserNameAndUriAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

// function processDeleteChatMessageIfAny(
//   deleteChatMessage?: ChatMessageWithState
// ): (chat: ChatWithMessages) => ChatWithMessages {
//   return (chat) => {
//     if (deleteChatMessage?.message.messageType !== 'DELETE_CHAT') return chat
//
//     const indexOfDeleteMessage = chat.messages.findIndex(
//       (message) => message.message.uuid === deleteChatMessage.message.uuid
//     )
//
//     return {
//       ...chat,
//       messages:
//         indexOfDeleteMessage !== -1
//           ? chat.messages.slice(indexOfDeleteMessage)
//           : chat.messages,
//     }
//   }
// }

function processIdentityRevealMessageIfAny(
  identityRevealMessage?: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (
      !identityRevealMessage?.message.deanonymizedUser?.name ||
      !identityRevealMessage?.message.image
    )
      return chat

    const realLifeInfo: UserNameAndUriAvatar = {
      userName: identityRevealMessage.message.deanonymizedUser.name,
      image: {type: 'imageUri', imageUri: identityRevealMessage.message.image},
    }
    return O.set(realLifeInfoOptic)(realLifeInfo)(chat)
  }
}

const realLifeInfoOptic = O.optic<ChatWithMessages>()
  .prop('chat')
  .prop('otherSide')
  .prop('realLifeInfo')

export default function addMessagesToChats(
  chats: ChatWithMessages[]
): (toAdd: ChatMessageWithState[]) => ChatWithMessages[] {
  return (toAdd) =>
    pipe(
      chats,
      A.map((oneChat) => {
        const messagesToAddToThisChat = toAdd.filter(
          (oneMessage) =>
            oneMessage.message.senderPublicKey ===
            oneChat.chat.otherSide.publicKey
        )

        if (messagesToAddToThisChat.length === 0) return oneChat

        const messages = messagesToAddToThisChat.reduce(
          (originalList, newMessage) =>
            addToSortedArray(
              originalList,
              compareMessages,
              areMessagesEqual
            )(newMessage),
          oneChat.messages
        )

        const identityRevealMessage = messagesToAddToThisChat
          .filter((one) =>
            ['APPROVE_REVEAL', 'REQUEST_REVEAL'].includes(
              one.message.messageType
            )
          )
          ?.at(-1)

        // const deleteTypeMessageTime =
        //   deleteTypeMessage?.message.time ?? UnixMilliseconds.parse(0)
        // const identityRevealMessageTime =
        //   identityRevealMessage?.message.time ?? UnixMilliseconds.parse(0)

        // if (deleteTypeMessageTime < identityRevealMessageTime) {
        //   return pipe(
        //     {...oneChat, messages, isUnread: true},
        //     processDeleteChatMessageIfAny(deleteTypeMessage),
        //     processIdentityRevealMessageIfAny(identityRevealMessage)
        //   )
        // } else {
        //   return pipe(
        //     {...oneChat, messages, isUnread: true},
        //     processDeleteChatMessageIfAny(deleteTypeMessage)
        //   )
        // }

        return pipe(
          {...oneChat, messages, chat: {...oneChat.chat, isUnread: true}},
          processIdentityRevealMessageIfAny(identityRevealMessage)
        )
      })
    )
}
