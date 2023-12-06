import {atom} from 'jotai'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import notEmpty from '../../../utils/notEmpty'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import sendMessagesBatch from '@vexl-next/resources-utils/dist/chat/sendMessagesBatch'
import {privateApiAtom} from '../../../api'
import allChatsAtom from './allChatsAtom'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import shouldSendTerminationMessageToChat from '../utils/shouldSendTerminationMessageToChat'
import {type ExtractLeftTE} from '@vexl-next/rest-api/dist/services/chat/utils'
import {addMessageToMessagesArray} from '../utils/addMessageToChat'

interface Params {
  chats: readonly ChatWithMessages[]
  messageData: Omit<ChatMessage, 'uuid' | 'senderPublicKey' | 'time'>
  isTerminationMessage: boolean
}

const sendMessageToChatsInBatchActionAtom = atom(
  null,
  (
    get,
    set,
    {messageData, chats, isTerminationMessage}: Params
  ): TE.TaskEither<
    ExtractLeftTE<ReturnType<typeof sendMessagesBatch>>,
    boolean
  > => {
    if (chats.length === 0) return TE.right(true)

    return pipe(
      chats,
      RNEA.groupBy(({chat}) => chat.inbox.privateKey.publicKeyPemBase64),
      (a) => Object.values(a),
      A.map((oneChat) => {
        if (oneChat.length === 0) return null
        const inboxKeypair = oneChat.at(0)?.chat.inbox.privateKey
        if (!inboxKeypair) return null

        return {
          inboxKeypair,
          messages: oneChat.map((chat) => {
            return {
              message: {
                ...messageData,
                uuid: generateChatMessageId(),
                senderPublicKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
                time: unixMillisecondsNow(),
              },
              receiverPublicKey: chat.chat.otherSide.publicKey,
              shouldSent:
                !isTerminationMessage ||
                shouldSendTerminationMessageToChat(chat),
            }
          }),
        }
      }),
      A.filter(notEmpty),
      TE.right,
      TE.chainFirstW((inboxes) =>
        sendMessagesBatch({
          api: get(privateApiAtom).chat,
          inboxes: inboxes.map((oneInbox) => ({
            ...oneInbox,
            messages: oneInbox.messages
              .map(({shouldSent, ...message}) => (shouldSent ? message : null))
              .filter(notEmpty),
          })),
        })
      ),
      TE.match(
        (l) => E.left(l),
        (inboxes) => {
          const messages = inboxes.map((one) => one.messages).flat()
          set(allChatsAtom, (prev) =>
            prev.map((oneChat) => {
              const sentMessage = messages.find(
                (one) =>
                  one.message.senderPublicKey ===
                  oneChat.chat.inbox.privateKey.publicKeyPemBase64
              )
              if (!sentMessage) return oneChat

              const messageToState: ChatMessageWithState = {
                state: 'sent',
                message: sentMessage.message,
              }

              return {
                ...oneChat,
                messages: addMessageToMessagesArray(oneChat.messages)(
                  messageToState
                ),
              }
            })
          )
          return E.right(true)
        }
      )
    )
  }
)

export default sendMessageToChatsInBatchActionAtom
