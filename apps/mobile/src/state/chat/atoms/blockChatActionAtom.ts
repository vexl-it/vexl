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
import sendMessage, {
  type SendMessageApiErrors,
} from '@vexl-next/resources-utils/dist/chat/sendMessage'
import {privateApiAtom} from '../../../api'

export default function blockChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{text: string}],
  TE.TaskEither<
    ErrorEncryptingMessage | SendMessageApiErrors,
    ChatMessageWithState
  >
> {
  return atom(null, (get, set, {text}) => {
    const {chat} = get(chatWithMessagesAtom)
    const api = get(privateApiAtom)

    const messageToSend: ChatMessage = {
      text,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      messageType: 'BLOCK_CHAT',
      senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
    }

    return pipe(
      sendMessage({
        api: api.chat,
        senderKeypair: chat.inbox.privateKey,
        receiverPublicKey: chat.otherSide.publicKey,
        message: messageToSend,
      }),
      TE.matchW(() => {
        // TODO check for network errors
        return E.right({}) as E.Either<any, any>
      }, E.right),
      TE.chainW(() =>
        api.chat.blockInbox({
          block: true,
          keyPair: chat.inbox.privateKey,
          publicKeyToBlock: chat.otherSide.publicKey,
        })
      ),
      TE.map((): ChatMessageWithState => {
        const successMessage = {
          message: messageToSend,
          state: 'sent',
        } as const

        set(chatWithMessagesAtom, (old) => ({
          ...old,
          messages: [successMessage],
        }))
        return successMessage
      })
    )
  })
}
