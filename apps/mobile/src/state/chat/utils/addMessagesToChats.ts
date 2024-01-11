import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import addToSortedArray from '../../../utils/addToSortedArray'
import compareMessages from './compareMessages'
import areMessagesEqual from './areMessagesEqual'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import processIdentityRevealMessageIfAny from './processIdentityRevealMessageIfAny'
import {updateTradeChecklistState} from '../../tradeChecklist/utils'
import notEmpty from '../../../utils/notEmpty'
import addRealLifeInfoToChat from './addRealLifeInfoToChat'

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
          .filter(
            (
              one
            ): one is typeof one & {
              message: {messageType: 'TRADE_CHECKLIST_UPDATE'}
            } => one.message.messageType === 'TRADE_CHECKLIST_UPDATE'
          )
          .map((one) => one.message.tradeChecklistUpdate)
          .filter(notEmpty)

        const tradeChecklistIdentityRevealMessage = tradeChecklistUpdates.find(
          (update) =>
            update.identity?.status &&
            ['APPROVE_REVEAL'].includes(update.identity.status)
        )?.identity

        const tradeChecklistContactRevealMessage = tradeChecklistUpdates.find(
          (update) =>
            update.contact?.status &&
            ['APPROVE_REVEAL'].includes(update.contact.status)
        )?.contact

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
          processIdentityRevealMessageIfAny(identityRevealMessage),
          addRealLifeInfoToChat(
            tradeChecklistIdentityRevealMessage,
            tradeChecklistContactRevealMessage
          )
        )
      })
    )
}
