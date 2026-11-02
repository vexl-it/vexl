import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
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
import {uploadChatImageIfAnyActionAtom} from '../chatImages'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'

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
          }),
          Effect.runFork
        )
      },
      {timeout: 500}
    )
  })
}
