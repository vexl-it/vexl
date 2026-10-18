import {Array} from 'effect'
import * as A from 'fp-ts/Array'
import {pipe} from 'fp-ts/function'
import addToSortedArray from '../../../utils/addToSortedArray'
import notEmpty from '../../../utils/notEmpty'
import {
  createEmptyTradeChecklistInState,
  type TradeChecklistInState,
} from '../../tradeChecklist/domain'
import {updateTradeChecklistState} from '../../tradeChecklist/utils'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addRealLifeInfoToChat from './addRealLifeInfoToChat'
import areMessagesEqual from './areMessagesEqual'
import {consumesHistory, restoredMessagesFromHistory} from './chatRecovery'
import compareMessages from './compareMessages'
import {
  isHiddenMetadataMessage,
  isMetadataMessageType,
} from './isMetadataMessage'
import processContactRevealMessageIfAny from './processContactRevealMessageIfAny'
import processIdentityRevealMessageIfAny from './processIdentityRevealMessageIfAny'
import {scheduleTradeReminderIfNeeded} from './scheduleTradeReminderIfNeeded'

function tradeChecklistFromMessages(
  messages: readonly ChatMessageWithState[]
): TradeChecklistInState {
  return Array.reduce(
    messages,
    createEmptyTradeChecklistInState(),
    (state, one) =>
      one.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
      one.message.tradeChecklistUpdate &&
      (one.state === 'received' || one.state === 'sent')
        ? updateTradeChecklistState(state)({
            update: one.message.tradeChecklistUpdate,
            direction: one.state,
          })
        : state
  )
}

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

        const restoredMessages = restoredMessagesFromHistory({
          chat: oneChat,
          incoming: messagesToAddToThisChat,
        })
        const isHistoryMerged = Array.isNonEmptyArray(restoredMessages)
        const historyMerged =
          oneChat.historyMerged ||
          consumesHistory({chat: oneChat, incoming: messagesToAddToThisChat})
        const incomingMessages = Array.sort(
          [...messagesToAddToThisChat, ...restoredMessages],
          compareMessages
        )
        const receivedMessages = incomingMessages.filter(
          (one) => one.state === 'received'
        )

        const messages = incomingMessages.reduce(
          (originalList, newMessage) =>
            addToSortedArray(
              originalList,
              compareMessages,
              areMessagesEqual
            )(newMessage),
          oneChat.messages
        )

        const identityRevealMessage = receivedMessages
          .filter((one) => ['APPROVE_REVEAL'].includes(one.message.messageType))
          ?.at(-1)

        const contactRevealMessage = receivedMessages
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

        const isOnlyMetadataUpdate = messagesToAddToThisChat.every((one) =>
          isMetadataMessageType(one.message.messageType)
        )

        // History requests carry the token of the other side's new device
        const fcmCypherUpdateFromOtherSide = messagesToAddToThisChat.findLast(
          (one) =>
            one.state === 'received' &&
            (one.message.messageType === 'FCM_CYPHER_UPDATE' ||
              one.message.messageType === 'REQUEST_HISTORY')
        )

        return pipe(
          {
            ...oneChat,
            historyMerged,
            messages: messages.filter((one) => !isHiddenMetadataMessage(one)),
            // Restored history lands before updates we already applied
            tradeChecklist: isHistoryMerged
              ? tradeChecklistFromMessages(messages)
              : tradeChecklistUpdates.reduce(
                  (acc, update) =>
                    updateTradeChecklistState(acc)({
                      update,
                      direction: 'received',
                    }),
                  oneChat.tradeChecklist
                ),
            chat: {
              ...oneChat.chat,
              isUnread: isOnlyMetadataUpdate ? oneChat.chat.isUnread : true,
              // This is trash I know. Ideall fix would be to set myFcmCypher to Option<FcmCypher> | undefined but then
              // there would be problem in handling older versions. So let's do it this way
              otherSideFcmCypher: (() => {
                // if we have received fcm cypher update message from the other side. And it includes null myFcmCypher
                // it means the other side has deleted their notification token
                if (fcmCypherUpdateFromOtherSide)
                  return fcmCypherUpdateFromOtherSide.message.myFcmCypher

                // In all other cases let's preserve the last received fcm cypher
                return lastReceivedMessage?.message?.myFcmCypher
                  ? lastReceivedMessage?.message?.myFcmCypher
                  : oneChat.chat.otherSideFcmCypher
              })(),
              otherSideVexlToken: (() => {
                if (fcmCypherUpdateFromOtherSide)
                  return fcmCypherUpdateFromOtherSide.message.myVexlToken

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
          (chat) =>
            addRealLifeInfoToChat(
              chat,
              // Covers reveals the other side requested and I approved
              isHistoryMerged
                ? {
                    update: {
                      identity: chat.tradeChecklist.identity.sent,
                      contact: chat.tradeChecklist.contact.sent,
                    },
                    requested: chat.tradeChecklist,
                  }
                : undefined
            ),
          scheduleTradeReminderIfNeeded(tradeChecklistUpdates)
        )
      })
    )
}
