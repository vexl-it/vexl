import {
  generateChatId,
  type Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import * as A from 'fp-ts/Array'
import {pipe} from 'fp-ts/function'
import {group} from 'group-items'
import notEmpty from '../../../utils/notEmpty'
import {createEmptyTradeChecklistInState} from '../../tradeChecklist/domain'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function createNewChatsFromFirstMessages({
  inbox,
  inboxOffer,
}: {
  inbox: Inbox
  inboxOffer?: OneOfferInState
}): (messages: ChatMessageWithState[]) => ChatWithMessages[] {
  return (messages) => {
    const messagesBySender = group(messages)
      .by((oneMessage) => oneMessage.message.senderPublicKey)
      .asObject()

    return pipe(
      keys(messagesBySender),
      A.map((senderPublicKey): ChatWithMessages | undefined => {
        const messages = messagesBySender[senderPublicKey]
        if (!messages) return undefined

        const lastMessage = messages.at(-1)
        if (!lastMessage) return undefined

        const otherSideVersion =
          lastMessage.state === 'receivedButRequiresNewerVersion' ||
          lastMessage.state === 'received'
            ? lastMessage.message.myVersion
            : undefined
        const lastReportedVersion =
          lastMessage.state === 'sending' ||
          lastMessage.state === 'sendingError' ||
          lastMessage.state === 'sent'
            ? lastMessage.message.myVersion
            : undefined

        return {
          chat: {
            inbox,
            origin: inbox.offerId
              ? {type: 'myOffer', offerId: inbox.offerId, offer: inboxOffer}
              : {type: 'unknown'},
            otherSide: {publicKey: senderPublicKey},
            id: generateChatId(),
            isUnread: true,
            showInfoBar: true,
            showVexlbotInitialMessage: true,
            showVexlbotNotifications: true,
            otherSideVersion,
            lastReportedVersion,
          },
          tradeChecklist: {
            ...createEmptyTradeChecklistInState(),
          },
          messages: [...messages],
        }
      }),
      A.filter(notEmpty)
    )
  }
}
