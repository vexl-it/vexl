import * as A from 'fp-ts/Array'
import {pipe} from 'fp-ts/function'
import addToSortedArray from '../../../utils/addToSortedArray'
import notEmpty from '../../../utils/notEmpty'
import {updateTradeChecklistState} from '../../tradeChecklist/utils'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addRealLifeInfoToChat from './addRealLifeInfoToChat'
import areMessagesEqual from './areMessagesEqual'
import compareMessages from './compareMessages'
import isMetadataOnlyMessage from './isMetadataOnlyMessage'
import processContactRevealMessageIfAny from './processContactRevealMessageIfAny'
import processIdentityRevealMessageIfAny from './processIdentityRevealMessageIfAny'
import {applyReceivedReactions} from './reactions'
import {scheduleTradeReminderIfNeeded} from './scheduleTradeReminderIfNeeded'

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

        const contactRevealMessage = messagesToAddToThisChat
          .filter((one) =>
            ['APPROVE_CONTACT_REVEAL'].includes(one.message.messageType)
          )
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

        const lastReceivedMessage = messages.findLast(
          (one) =>
            one.state === 'received' ||
            one.state === 'receivedButRequiresNewerVersion'
        )

        const isOnlyMetadataUpdate = messagesToAddToThisChat.every(
          isMetadataOnlyMessage
        )

        const vexlTokenUpdateFromOtherSide = messagesToAddToThisChat.findLast(
          (one) =>
            one.state === 'received' &&
            one.message.messageType === 'FCM_CYPHER_UPDATE'
        )

        return pipe(
          {
            ...oneChat,
            // Do not show metadata updates in chat
            messages: messages.filter(
              (one) =>
                !isMetadataOnlyMessage(one) ||
                // Show messages with forceShow flag
                (one.state !== 'receivedButRequiresNewerVersion' &&
                  one.message.forceShow)
            ),
            reactions: applyReceivedReactions(
              oneChat.reactions,
              messagesToAddToThisChat
            ),
            tradeChecklist: tradeChecklistUpdates.reduce(
              (acc, update) =>
                updateTradeChecklistState(acc)({update, direction: 'received'}),
              oneChat.tradeChecklist
            ),
            chat: {
              ...oneChat.chat,
              isUnread: isOnlyMetadataUpdate ? oneChat.chat.isUnread : true,
              otherSideVexlToken: (() => {
                if (vexlTokenUpdateFromOtherSide)
                  return vexlTokenUpdateFromOtherSide.message.myVexlToken

                return lastReceivedMessage?.message?.myVexlToken
                  ? lastReceivedMessage?.message?.myVexlToken
                  : oneChat.chat.otherSideVexlToken
              })(),
              otherSideVersion:
                lastReceivedMessage?.message.myVersion ??
                oneChat.chat.otherSideVersion,
            },
          },
          processIdentityRevealMessageIfAny(identityRevealMessage),
          processContactRevealMessageIfAny(contactRevealMessage),
          addRealLifeInfoToChat,
          scheduleTradeReminderIfNeeded(tradeChecklistUpdates)
        )
      })
    )
}
