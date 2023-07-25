import {atom} from 'jotai'
import * as T from 'fp-ts/Task'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {privateApiAtom} from '../../../api'
import addMessageToChat from '../utils/addMessageToChat'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import sendMessage from '@vexl-next/resources-utils/dist/chat/sendMessage'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import replaceImageFileUrisWithBase64 from '../utils/replaceImageFileUrisWithBase64'

type SendMessageAtom = ActionAtomType<
  [ChatMessage],
  T.Task<ChatMessageWithState>
>

export default function sendMessageActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): SendMessageAtom {
  return atom(null, (get, set, message) => {
    const api = get(privateApiAtom)

    set(
      chatWithMessagesAtom,
      addMessageToChat({
        state: 'sending',
        message,
      })
    )

    const chatWithMessages = get(chatWithMessagesAtom)
    const {chat} = chatWithMessages

    return pipe(
      TE.Do,
      T.delay(2000), // TODO check for value maybe try `InteractionManager.runAfterTransaction`?
      TE.chainTaskK(() => replaceImageFileUrisWithBase64(message)),
      TE.chainW((m) =>
        sendMessage({
          message: m,
          api: api.chat,
          senderKeypair: chat.inbox.privateKey,
          receiverPublicKey: chat.otherSide.publicKey,
        })
      ),
      TE.match(
        (e): ChatMessageWithState => {
          if (
            e._tag === 'inboxDoesNotExist' ||
            e._tag === 'notPermittedToSendMessageToTargetInbox'
          ) {
            return {
              state: 'received',
              message: {
                messageType: 'INBOX_DELETED',
                time: now(),
                senderPublicKey: chatWithMessages.chat.otherSide.publicKey,
                uuid: generateChatMessageId(),
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
        (): ChatMessageWithState => ({
          state: 'sent',
          message,
        })
      ),
      T.map((message) => {
        set(chatWithMessagesAtom, addMessageToChat(message))
        return message
      })
    )
  })
}
