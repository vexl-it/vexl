import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendLeaveChat from '@vexl-next/resources-utils/src/chat/sendLeaveChat'
import {type SendMessageApiErrors} from '@vexl-next/resources-utils/src/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {removeFeedbackRecordActionAtom} from '../../feedback/atoms'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {resetTradeChecklist} from '../utils/resetData'
import shouldSendTerminationMessageToChat from '../utils/shouldSendTerminationMessageToChat'

export default function deleteChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{text: string}],
  TE.TaskEither<
    | ErrorEncryptingMessage
    | SendMessageApiErrors
    | ZodParseError<ChatMessagePayload>
    | JsonStringifyError,
    ChatMessageWithState
  >
> {
  return atom(null, (get, set, {text}) => {
    const chatWithMessages = get(chatWithMessagesAtom)
    const {chat} = chatWithMessages
    const api = get(apiAtom)

    const shouldSendMessage =
      shouldSendTerminationMessageToChat(chatWithMessages)

    const messageToSend: ChatMessage = {
      text,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      messageType: 'DELETE_CHAT',
      myVersion: version,
      senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
    }

    return pipe(
      shouldSendMessage
        ? sendLeaveChat({
            api: api.chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            message: messageToSend,
            theirFcmCypher: chat.otherSideFcmCypher,
            notificationApi: api.notification,
            otherSideVersion: chat.otherSideVersion,
          })
        : TE.right({}),
      TE.matchW(
        (e): E.Either<typeof e, null> => {
          if (
            e._tag === 'inboxDoesNotExist' ||
            e._tag === 'notPermittedToSendMessageToTargetInbox'
          ) {
            return E.right(null)
          }

          return E.left(e)
        },
        () => E.right(null)
      ),
      TE.map((): ChatMessageWithState => {
        const successMessage = {
          message: messageToSend,
          state: 'sent',
        } as const

        const identityRevealedOrDeclinedMessage =
          chatWithMessages.messages.find(
            (one) =>
              one.message.messageType === 'APPROVE_REVEAL' ||
              one.message.messageType === 'DISAPPROVE_REVEAL'
          )

        const phoneNumberRevealedOrDeclinedMessage =
          chatWithMessages.messages.find(
            (one) =>
              one.message.messageType === 'APPROVE_CONTACT_REVEAL' ||
              one.message.messageType === 'DISAPPROVE_CONTACT_REVEAL'
          )

        set(removeFeedbackRecordActionAtom, chatWithMessages.chat.id)

        set(
          chatWithMessagesAtom,
          flow(
            (old) => ({
              ...old,
              chat: {
                ...old.chat,
                lastReportedVersion:
                  messageToSend.myVersion ?? old.chat.lastReportedVersion,
              },
              // we want to keep the phone number message in chat history in case of re-request
              messages: [
                ...(identityRevealedOrDeclinedMessage
                  ? [identityRevealedOrDeclinedMessage]
                  : []),
                ...(phoneNumberRevealedOrDeclinedMessage
                  ? [phoneNumberRevealedOrDeclinedMessage]
                  : []),
                successMessage,
              ],
            }),
            resetTradeChecklist
            // resetRealLifeInfo
          )
        )
        return successMessage
      })
    )
  })
}
