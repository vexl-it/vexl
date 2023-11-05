import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {atom} from 'jotai'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {pipe} from 'fp-ts/function'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {type SendMessageApiErrors} from '@vexl-next/resources-utils/dist/chat/sendMessage'
import {privateApiAtom} from '../../../api'
import shouldSendTerminationMessageToChat from '../utils/shouldSendTerminationMessageToChat'
import sendLeaveChat from '@vexl-next/resources-utils/dist/chat/sendLeaveChat'
import {deleteChatFiles} from '../../../utils/fsDirectories'

export default function deleteChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{text: string}],
  TE.TaskEither<
    ErrorEncryptingMessage | SendMessageApiErrors,
    ChatMessageWithState
  >
> {
  return atom(null, (get, set, {text}) => {
    const chatWithMessages = get(chatWithMessagesAtom)
    const {chat} = chatWithMessages
    const api = get(privateApiAtom)

    const shouldSendMessage =
      shouldSendTerminationMessageToChat(chatWithMessages)

    const messageToSend: ChatMessage = {
      text,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      messageType: 'DELETE_CHAT',
      senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
    }

    return pipe(
      shouldSendMessage
        ? sendLeaveChat({
            api: api.chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            message: messageToSend,
          })
        : TE.right({}),
      TE.matchW(
        (e): E.Either<typeof e, null> => {
          if (
            e._tag === 'inboxDoesNotExist' ||
            e._tag === 'notPermittedToSendMessageToTargetInbox'
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

        void deleteChatFiles(
          chat.inbox.privateKey.publicKeyPemBase64,
          chat.otherSide.publicKey
        )

        set(chatWithMessagesAtom, (old) => ({
          ...old,
          messages: [successMessage],
        }))
        return successMessage
      })
    )
  })
}
