import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import addToSortedArray from '../../../utils/addToSortedArray'
import compareMessages from './compareMessages'
import areMessagesEqual from './areMessagesEqual'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import processIdentityRevealMessageIfAny from './processIdentityRevealMessageIfAny'
import {updateTradeChecklistState} from '../../tradeChecklist/utils'
import notEmpty from '../../../utils/notEmpty'

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
          .filter((one) => ['APPROVE_REVEAL'].includes(one.message.messageType))
          ?.at(-1)

        const tradeChecklistUpdates = messagesToAddToThisChat
          .filter((one) => one.message.messageType === 'TRADE_CHECKLIST_UPDATE')
          .map((one) => one.message.tradeChecklistUpdate)
          .filter(notEmpty)

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
          {
            ...oneChat,
            messages,
            tradeChecklist: tradeChecklistUpdates.reduce(
              (acc, update) =>
                updateTradeChecklistState(acc)({update, direction: 'received'}),
              oneChat.tradeChecklist
            ),
            chat: {...oneChat.chat, isUnread: true},
          },
          processIdentityRevealMessageIfAny(identityRevealMessage)
        )
      })
    )
}
