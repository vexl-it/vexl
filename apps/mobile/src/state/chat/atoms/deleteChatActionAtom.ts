import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendLeaveChat from '@vexl-next/resources-utils/src/chat/sendLeaveChat'
import {type SendMessageApiErrors} from '@vexl-next/resources-utils/src/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {deleteChatFiles} from '../../../utils/fsDirectories'
import {removeFeedbackRecordActionAtom} from '../../feedback/atoms'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import shouldSendTerminationMessageToChat from '../utils/shouldSendTerminationMessageToChat'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'

export default function deleteChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{text: string}],
  TE.TaskEither<
    | ErrorEncryptingMessage
    | SendMessageApiErrors
    | ZodParseError<ChatMessagePayload>
    | JsonStringifyError,
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

        set(removeFeedbackRecordActionAtom, chatWithMessages.chat.id)

        set(chatWithMessagesAtom, (old) => ({
          ...old,
          messages: [successMessage],
        }))
        return successMessage
      })
    )
  })
}
