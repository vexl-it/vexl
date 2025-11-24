import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendLeaveChat from '@vexl-next/resources-utils/src/chat/sendLeaveChat'
import {Effect, flow} from 'effect'
import {atom, type WritableAtom} from 'jotai'
import {apiAtom} from '../../../api'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {removeFeedbackRecordActionAtom} from '../../feedback/atoms'
import {type ChatWithMessages} from '../domain'
import {resetTradeChecklist} from '../utils/resetData'
import shouldSendTerminationMessageToChat from '../utils/shouldSendTerminationMessageToChat'

export default function deleteChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): WritableAtom<null, [{text: string}], any> {
  return atom(null, (get, set, {text}: {text: string}) => {
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

    return Effect.gen(function* (_) {
      if (shouldSendMessage) {
        yield* _(
          sendLeaveChat({
            api: api.chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            message: messageToSend,
            theirNotificationCypher: chat.otherSideFcmCypher,
            notificationApi: api.notification,
            otherSideVersion: chat.otherSideVersion,
          }),
          Effect.catchAll((e) => {
            if (
              e._tag === 'ReceiverInboxDoesNotExistError' ||
              e._tag === 'NotPermittedToSendMessageToTargetInboxError'
            ) {
              return Effect.succeed(null)
            }
            return Effect.fail(e)
          })
        )
      }

      const successMessage = {
        message: messageToSend,
        state: 'sent',
      } as const

      const identityRevealedOrDeclinedMessage = chatWithMessages.messages.find(
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
  })
}
