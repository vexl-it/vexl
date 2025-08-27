import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {InteractionManager} from 'react-native'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import replaceImageFileUrisWithBase64 from '../utils/replaceImageFileUrisWithBase64'

type SendMessageAtom = ActionAtomType<
  [ChatMessage],
  ReturnType<typeof InteractionManager.runAfterInteractions>
>

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
    const {chat} = chatWithMessages

    return InteractionManager.runAfterInteractions(() => {
      return Effect.gen(function* (_) {
        const m = yield* _(
          taskToEffect(replaceImageFileUrisWithBase64(message))
        )

        yield* _(
          sendMessage({
            message: m,
            api: api.chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            notificationApi: api.notification,
            theirNotificationCypher: chat.otherSideFcmCypher,
            otherSideVersion: chat.otherSideVersion,
          })
        )
      }).pipe(
        Effect.match({
          onFailure(e) {
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
              } as ChatMessageWithState
            }

            return {
              state: 'sendingError',
              error: e,
              message,
            } as ChatMessageWithState
          },
          onSuccess() {
            return {
              state: 'sent',
              message,
            } as ChatMessageWithState
          },
        }),
        Effect.map((message) => {
          set(chatWithMessagesAtom, addMessageToChat(message))
          return message
        }),
        Effect.runFork
      )
    })
  })
}
