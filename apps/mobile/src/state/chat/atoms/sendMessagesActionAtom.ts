import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {
  now,
  UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Array, Effect, Schema} from 'effect'
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

type SendingError = Extract<
  ChatMessageWithState,
  {state: 'sendingError'}
>['error']

/**
 * Shows all messages as sending right away, then sends them one by one so
 * they reach the other side in the given order. The first failure stops the
 * rest of the batch.
 */
export default function sendMessagesActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): SendMessagesAtom {
  // Later sends and retries in this chat wait for the batches before them.
  const sendQueue = Effect.unsafeMakeSemaphore(1)

  return atom(null, (get, set, messages) => {
    const api = get(apiAtom)

    const showAsSending = (message: ChatMessage): void => {
      set(chatWithMessagesAtom, addMessageToChat({state: 'sending', message}))
    }

    Array.forEach(messages, showAsSending)

    const chatWithMessages = get(chatWithMessagesAtom)
    const {chat} = chatWithMessages
    const numberOfMessagesInChat = chatWithMessages.messages.length

    // False once the chat is deleted, so the rest of its batch is not sent.
    const isStillSending = (message: ChatMessage): boolean =>
      Array.some(
        get(chatWithMessagesAtom).messages,
        (one) => one.state === 'sending' && one.message.uuid === message.uuid
      )

    const sendMessageInChat = (
      message: ChatMessage
    ): Effect.Effect<ChatMessageWithState> =>
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
        )
      )

    const markAsFailed = (
      pending: readonly ChatMessage[],
      error: SendingError
    ): void => {
      Array.forEach(Array.filter(pending, isStillSending), (message) => {
        set(
          chatWithMessagesAtom,
          addMessageToChat({state: 'sendingError', error, message})
        )
      })
    }

    // Sent messages are ordered by server time, which is later than the
    // client time of the rest of the batch, so move the rest after it.
    const placeAfter = (
      receivedByServerAt: UnixMilliseconds,
      pending: readonly ChatMessage[]
    ): readonly ChatMessage[] => {
      const placed = Array.map(pending, (message, index) => ({
        ...message,
        time: Schema.decodeSync(UnixMilliseconds)(
          receivedByServerAt + index + 1
        ),
      }))
      Array.forEach(placed, showAsSending)
      return placed
    }

    const sendInOrder = (
      pending: readonly ChatMessage[],
      previousReceivedByServerAt?: UnixMilliseconds
    ): Effect.Effect<void> =>
      Effect.gen(function* (_) {
        const stillPending = Array.filter(pending, isStillSending)
        const stillSending = previousReceivedByServerAt
          ? placeAfter(previousReceivedByServerAt, stillPending)
          : stillPending
        if (!Array.isNonEmptyReadonlyArray(stillSending)) return

        const [message, ...rest] = stillSending
        const result = yield* _(sendMessageInChat(message))
        set(chatWithMessagesAtom, addMessageToChat(result))

        if (result.state === 'sendingError') {
          markAsFailed(rest, result.error)
          return
        }
        if (result.state !== 'sent') {
          markAsFailed(stillSending, {_tag: 'ReceiverInboxDoesNotExistError'})
          return
        }

        if (
          numberOfMessagesInChat > DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT
        )
          yield* _(
            Effect.forkDaemon(
              set(showDonationPromptGiveLoveActionAtom, {skipTimeCheck: false})
            )
          )

        yield* _(sendInOrder(rest, result.receivedByServerAt))
      })

    // Timeout prevents message sending from starving during continuous interactions.
    runWhenIdleWithTimeout(
      () => {
        Effect.runFork(sendQueue.withPermits(1)(sendInOrder(messages)))
      },
      {timeout: 500}
    )
  })
}
