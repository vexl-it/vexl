import {
  generateChatId,
  type Inbox,
} from '@vexl-next/domain/dist/general/messaging'
import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {group} from 'group-items'
import {keys} from '@vexl-next/resources-utils/dist/utils/keys'
import notEmpty from '../../../utils/notEmpty'
import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'
import {generateInitialFeedback} from '../../../components/UserFeedback/atoms'

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
          },
          feedback: generateInitialFeedback('CHAT_RATING'),
          messages: [...messages],
        }
      }),
      A.filter(notEmpty)
    )
  }
}
