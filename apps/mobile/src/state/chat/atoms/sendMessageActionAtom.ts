import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {InteractionManager} from 'react-native'
import {privateApiAtom} from '../../../api'
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

    return InteractionManager.runAfterInteractions(() => {
      void pipe(
        TE.Do,
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
          (): ChatMessageWithState => ({
            state: 'sent',
            message,
          })
        ),
        T.map((message) => {
          set(chatWithMessagesAtom, addMessageToChat(message))
          return message
        })
      )()
    })
  })
}
