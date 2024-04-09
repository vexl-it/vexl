import * as A from 'fp-ts/Array'
import {pipe} from 'fp-ts/function'
import addToSortedArray from '../../../utils/addToSortedArray'
import notEmpty from '../../../utils/notEmpty'
import {updateTradeChecklistState} from '../../tradeChecklist/utils'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {
  addContactRealLifeInfoToChat,
  addIdentityRealLifeInfoToChat,
} from './addRealLifeInfoToChat'
import areMessagesEqual from './areMessagesEqual'
import compareMessages from './compareMessages'
import processContactRevealMessageIfAny from './processContactRevealMessageIfAny'
import processIdentityRevealMessageIfAny from './processIdentityRevealMessageIfAny'

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

        const lastReceivedMessage = messages.findLast(
          (one) =>
            one.state === 'received' ||
            one.state === 'receivedButRequiresNewerVersion'
        )

        const isOnlyMetadataUpdate = !messages.some(
          (one) =>
            one.message.messageType !== 'VERSION_UPDATE' &&
            one.message.messageType !== 'FCM_CYPHER_UPDATE'
        )

        return pipe(
          {
            ...oneChat,
            // Do not show metadata updates in chat
            messages: messages.filter(
              (one) =>
                (one.message.messageType !== 'VERSION_UPDATE' &&
                  one.message.messageType !== 'FCM_CYPHER_UPDATE') ||
                // Show messages with forceShow flag
                (one.state !== 'receivedButRequiresNewerVersion' &&
                  one.message.forceShow)
            ),
            tradeChecklist: tradeChecklistUpdates.reduce(
              (acc, update) =>
                updateTradeChecklistState(acc)({update, direction: 'received'}),
              oneChat.tradeChecklist
            ),
            chat: {
              ...oneChat.chat,
              isUnread: isOnlyMetadataUpdate ? oneChat.chat.isUnread : true,
              otherSideFcmCypher: lastReceivedMessage?.message?.myFcmCypher
                ? lastReceivedMessage?.message?.myFcmCypher
                : oneChat.chat.otherSideFcmCypher,
              otherSideVersion:
                lastReceivedMessage?.message.myVersion ??
                oneChat.chat.otherSideVersion,
            },
          },
          processIdentityRevealMessageIfAny(identityRevealMessage),
          processContactRevealMessageIfAny(contactRevealMessage),
          addIdentityRealLifeInfoToChat(tradeChecklistIdentityRevealMessage),
          addContactRealLifeInfoToChat(tradeChecklistContactRevealMessage)
        )
      })
    )
}
