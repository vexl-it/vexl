import {
  generateChatMessageId,
  type ChatId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {
  now,
  UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Array, Effect, Option, pipe, Schema} from 'effect'
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

// Later sends and retries in a chat wait for its earlier batches, also when
// the chat screen is opened again in the meantime.
const sendQueues = new Map<ChatId, Effect.Semaphore>()

function getSendQueue(chatId: ChatId): Effect.Semaphore {
  const existing = sendQueues.get(chatId)
  if (existing) return existing
  const queue = Effect.unsafeMakeSemaphore(1)
  sendQueues.set(chatId, queue)
  return queue
}

/**
 * Shows all messages as sending right away, then sends them one by one so
 * they reach the other side in the given order. The first failure stops the
 * rest of the batch.
 */
export default function sendMessagesActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): SendMessagesAtom {
  return atom(null, (get, set, messages) => {
    const api = get(apiAtom)

    const showAsSending = (message: ChatMessage): void => {
      set(chatWithMessagesAtom, addMessageToChat({state: 'sending', message}))
    }

    Array.forEach(messages, showAsSending)

    const chatWithMessages = get(chatWithMessagesAtom)
    const {chat} = chatWithMessages
    const numberOfMessagesInChat = chatWithMessages.messages.length

    const sendingMessages = (): readonly ChatMessage[] =>
      Array.filterMap(get(chatWithMessagesAtom).messages, (one) =>
        one.state === 'sending' ? Option.some(one.message) : Option.none()
      )

    // Current versions of the batch messages that still wait to be sent.
    // Empty once the chat is deleted, so the rest of its batch is not sent.
    const stillSending = (
      batch: readonly ChatMessage[]
    ): readonly ChatMessage[] =>
      Array.filter(sendingMessages(), (message) =>
        Array.some(batch, (one) => one.uuid === message.uuid)
      )

    // Sent messages are ordered by server time, which is later than the
    // client time of the messages queued after it, so move those after it.
    const moveQueuedAfter = (
      sent: ChatMessage,
      receivedByServerAt: UnixMilliseconds
    ): void => {
      pipe(
        sendingMessages(),
        Array.filter((message) => message.time > sent.time),
        Array.forEach((message, index) => {
          showAsSending({
            ...message,
            time: Schema.decodeSync(UnixMilliseconds)(
              receivedByServerAt + index + 1
            ),
          })
        })
      )
    }

    const markAsFailed = (
      batch: readonly ChatMessage[],
      error: SendingError
    ): void => {
      Array.forEach(stillSending(batch), (message) => {
        set(
          chatWithMessagesAtom,
          addMessageToChat({state: 'sendingError', error, message})
        )
      })
    }

    const sendMessageInChat = (
      message: ChatMessage
    ): Effect.Effect<Option.Option<ChatMessageWithState>> =>
      set(uploadChatImageIfAnyActionAtom, {message, chat}).pipe(
        Effect.flatMap((preparedMessage) =>
          // The chat may have been deleted while the image was uploading.
          !Array.isNonEmptyReadonlyArray(stillSending([message]))
            ? Effect.succeedNone
            : sendMessage({
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
                      senderPublicKey: chat.otherSide.publicKey,
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
                ),
                Effect.asSome
              )
        ),
        Effect.catchAll((error) =>
          Effect.succeedSome<ChatMessageWithState>({
            state: 'sendingError',
            error,
            message,
          })
        )
      )

    const sendInOrder = (batch: readonly ChatMessage[]): Effect.Effect<void> =>
      Effect.gen(function* (_) {
        const pending = stillSending(batch)
        if (!Array.isNonEmptyReadonlyArray(pending)) return

        const [message, ...rest] = pending
        const sendResult = yield* _(sendMessageInChat(message))
        if (Option.isNone(sendResult)) return

        const result = sendResult.value
        set(chatWithMessagesAtom, addMessageToChat(result))

        if (result.state === 'sendingError') {
          markAsFailed(rest, result.error)
          return
        }
        if (result.state !== 'sent') {
          markAsFailed(pending, {_tag: 'ReceiverInboxDoesNotExistError'})
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

        if (result.receivedByServerAt)
          moveQueuedAfter(message, result.receivedByServerAt)
        yield* _(sendInOrder(rest))
      })

    // Timeout prevents message sending from starving during continuous interactions.
    runWhenIdleWithTimeout(
      () => {
        Effect.runFork(
          getSendQueue(chat.id).withPermits(1)(sendInOrder(messages))
        )
      },
      {timeout: 500}
    )
  })
}
