import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import showDonationPromptGiveLoveActionAtom, {
  DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT,
} from '../../../components/DonationPrompt/atoms/showDonationPromptGiveLoveActionAtom'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import runWhenIdleWithTimeout from '../../../utils/runWhenIdleWithTimeout'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import replaceImageFileUrisWithBase64 from '../utils/replaceImageFileUrisWithBase64'

type SendMessageAtom = ActionAtomType<[ChatMessage], void>

export default function sendMessageActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): SendMessageAtom {
  return atom(null, (get, set, message) => {
    const api = get(apiAtom)

    set(
      chatWithMessagesAtom,
      addMessageToChat({
        state: 'sending',
        message,
      })
    )

    const chatWithMessages = get(chatWithMessagesAtom)
    const {chat, messages} = chatWithMessages
    const numberOfMessagesInChat = messages.length

    // Timeout prevents message sending from starving during continuous interactions.
    runWhenIdleWithTimeout(
      () => {
        Effect.gen(function* (_) {
          const m = yield* _(
            taskToEffect(replaceImageFileUrisWithBase64(message))
          )

          const serverMessage = yield* _(
            sendMessage({
              message: m,
              api: api.chat,
              senderKeypair: chat.inbox.privateKey,
              receiverPublicKey: chat.otherSide.publicKey,
              notificationApi: api.notification,
              theirNotificationCypher:
                chat.otherSideVexlToken ?? chat.otherSideFcmCypher,
              otherSideVersion: chat.otherSideVersion,
            })
          )

          if (
            numberOfMessagesInChat >
            DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT
          )
            yield* _(
              set(showDonationPromptGiveLoveActionAtom, {skipTimeCheck: false})
            )

          return serverMessage
        }).pipe(
          Effect.match({
            onFailure(e): ChatMessageWithState {
              if (
                e._tag === 'ReceiverInboxDoesNotExistError' ||
                e._tag === 'NotPermittedToSendMessageToTargetInboxError'
              ) {
                return {
                  state: 'received',
                  message: {
                    messageType: 'INBOX_DELETED',
                    time: now(),
                    senderPublicKey: chatWithMessages.chat.otherSide.publicKey,
                    uuid: generateChatMessageId(),
                    myVersion: version,
                    text: 'Inbox deleted',
                  },
                }
              }

              return {
                state: 'sendingError',
                error: e,
                message,
              }
            },
            onSuccess(serverMessage): ChatMessageWithState {
              return {
                state: 'sent',
                message,
                receivedByServerAt: serverMessage.receivedByServerAt,
              }
            },
          }),
          Effect.map((message) => {
            set(chatWithMessagesAtom, addMessageToChat(message))
            return message
          }),
          Effect.runFork
        )
      },
      {timeout: 500}
    )
  })
}
