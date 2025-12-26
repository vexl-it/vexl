import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendLeaveChat from '@vexl-next/resources-utils/src/chat/sendLeaveChat'
import {type SendMessageApiErrors} from '@vexl-next/resources-utils/src/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {type JsonStringifyError} from '@vexl-next/resources-utils/src/utils/parsing'
import {flow, pipe, type Effect, type ParseResult} from 'effect'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {removeFeedbackRecordActionAtom} from '../../feedback/atoms'
import {cancelTradeReminderActionAtom} from '../../tradeReminders/atoms/cancelTradeReminderActionAtom'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {resetTradeChecklist} from '../utils/resetData'
import shouldSendTerminationMessageToChat from '../utils/shouldSendTerminationMessageToChat'

export default function deleteChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{text: string}],
  TE.TaskEither<
    | ErrorEncryptingMessage
    | Exclude<
        SendMessageApiErrors,
        {
          _tag:
            | 'ReceiverInboxDoesNotExistError'
            | 'NotPermittedToSendMessageToTargetInboxError'
        }
      >
    | ParseResult.ParseError
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
        ? effectToTaskEither(
            sendLeaveChat({
              api: api.chat,
              senderKeypair: chat.inbox.privateKey,
              receiverPublicKey: chat.otherSide.publicKey,
              message: messageToSend,
              theirNotificationCypher: chat.otherSideFcmCypher,
              notificationApi: api.notification,
              otherSideVersion: chat.otherSideVersion,
            })
          )
        : // eslint-disable-next-line @typescript-eslint/ban-types
          TE.right<Effect.Effect.Error<ReturnType<typeof sendLeaveChat>>, {}>(
            {}
          ),
      TE.matchW(
        (e) => {
          if (
            e._tag === 'ReceiverInboxDoesNotExistError' ||
            e._tag === 'NotPermittedToSendMessageToTargetInboxError'
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
        void set(cancelTradeReminderActionAtom, chatWithMessages.chat.id)

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
