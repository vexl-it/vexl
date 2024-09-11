import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessagesBatch from '@vexl-next/resources-utils/src/chat/sendMessagesBatch'
import {type ExtractLeftTE} from '@vexl-next/resources-utils/src/utils/ExtractLeft'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import notEmpty from '../../../utils/notEmpty'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import shouldSendTerminationMessageToChat from '../utils/shouldSendTerminationMessageToChat'
import allChatsAtom from './allChatsAtom'

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
          api: get(apiAtom).chat,
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

              return addMessageToChat(messageToState)(oneChat)
            })
          )
          return E.right(true)
        }
      )
    )
  }
)

export default sendMessageToChatsInBatchActionAtom
