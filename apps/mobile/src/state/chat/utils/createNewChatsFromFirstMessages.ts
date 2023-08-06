import {
  generateChatId,
  type Inbox,
} from '@vexl-next/domain/dist/general/messaging'
import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import notifee from '@notifee/react-native'

export default function createNewChatsFromFirstMessages(
  inbox: Inbox
): (messages: ChatMessageWithState[]) => ChatWithMessages[] {
  void notifee.incrementBadgeCount()

  return (messages) =>
    pipe(
      messages,
      A.map((oneMessage): ChatWithMessages => {
        return {
          chat: {
            inbox,
            origin: inbox.offerId
              ? {type: 'myOffer', offerId: inbox.offerId}
              : {type: 'unknown'},
            otherSide: {publicKey: oneMessage.message.senderPublicKey},
            id: generateChatId(),
            isUnread: true,
          },
          messages: [oneMessage],
        }
      })
    )
}
