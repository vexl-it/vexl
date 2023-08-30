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

export default function createNewChatsFromFirstMessages(
  inbox: Inbox
): (messages: ChatMessageWithState[]) => ChatWithMessages[] {
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
              ? {type: 'myOffer', offerId: inbox.offerId}
              : {type: 'unknown'},
            otherSide: {publicKey: senderPublicKey},
            id: generateChatId(),
            isUnread: true,
          },
          messages: [...messages],
        }
      }),
      A.filter(notEmpty)
    )
  }
}
