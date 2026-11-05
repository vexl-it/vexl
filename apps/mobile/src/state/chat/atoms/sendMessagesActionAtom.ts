import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import showDonationPromptGiveLoveActionAtom, {
  DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT,
} from '../../../components/DonationPrompt/atoms/showDonationPromptGiveLoveActionAtom'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import runWhenIdleWithTimeout from '../../../utils/runWhenIdleWithTimeout'
import {uploadChatImageIfAnyActionAtom} from '../chatImages'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'

type SendMessagesAtom = ActionAtomType<
  [Array.NonEmptyReadonlyArray<ChatMessage>],
  void
>

/**
 * Shows all messages as sending right away, then sends them one by one so
 * they reach the other side in the given order.
 */
export default function sendMessagesActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): SendMessagesAtom {
  return atom(null, (get, set, messages) => {
    const api = get(apiAtom)

    Array.forEach(messages, (message) => {
      set(
        chatWithMessagesAtom,
        addMessageToChat({
          state: 'sending',
          message,
        })
      )
    })

    const chatWithMessages = get(chatWithMessagesAtom)
    const {chat} = chatWithMessages
    const numberOfMessagesInChat = chatWithMessages.messages.length

    const sendMessageInChat = (message: ChatMessage): Effect.Effect<void> =>
      set(uploadChatImageIfAnyActionAtom, {message, chat}).pipe(
        Effect.flatMap((preparedMessage) =>
          sendMessage({
            message: preparedMessage,
            api: api.chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            notificationApi: api.notification,
            theirNotificationToken: chat.otherSideVexlToken,
          }).pipe(
            Effect.map(
              (serverMessage): ChatMessageWithState => ({
                state: 'sent',
                message: preparedMessage,
                receivedByServerAt: serverMessage.receivedByServerAt,
              })
            ),
            Effect.catchTag('ReceiverInboxDoesNotExistError', () =>
              Effect.succeed<ChatMessageWithState>({
                state: 'received',
                message: {
                  messageType: 'INBOX_DELETED',
                  time: now(),
                  senderPublicKey: chatWithMessages.chat.otherSide.publicKey,
                  uuid: generateChatMessageId(),
                  myVersion: version,
                  text: 'Inbox deleted',
                },
              })
            ),
            Effect.catchAll((error) =>
              Effect.succeed<ChatMessageWithState>({
                state: 'sendingError',
                error,
                message: preparedMessage,
              })
            )
          )
        ),
        Effect.catchAll((error) =>
          Effect.succeed<ChatMessageWithState>({
            state: 'sendingError',
            error,
            message,
          })
        ),
        Effect.tap((messageWithState) => {
          set(chatWithMessagesAtom, addMessageToChat(messageWithState))
          if (
            messageWithState.state === 'sent' &&
            numberOfMessagesInChat >
              DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT
          )
            return set(showDonationPromptGiveLoveActionAtom, {
              skipTimeCheck: false,
            })
          return Effect.void
        })
      )

    // Timeout prevents message sending from starving during continuous interactions.
    runWhenIdleWithTimeout(
      () => {
        Effect.runFork(
          Effect.forEach(messages, sendMessageInChat, {discard: true})
        )
      },
      {timeout: 500}
    )
  })
}
