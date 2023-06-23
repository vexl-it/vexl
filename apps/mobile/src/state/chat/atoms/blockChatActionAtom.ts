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
import sendMessage from '@vexl-next/resources-utils/dist/chat/sendMessage'
import {privateApiAtom} from '../../../api'
import {type ExtractLeftTE} from '@vexl-next/resources-utils/dist/utils/ExtractLeft'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {createSingleOfferReportedFlagAtom} from '../../marketplace/atom'

export default function blockChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{text: string}],
  TE.TaskEither<
    | ErrorEncryptingMessage
    | ExtractLeftTE<ReturnType<ChatPrivateApi['blockInbox']>>
    | ExtractLeftTE<ReturnType<typeof sendMessage>>,
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

        if (chat.origin.type === 'theirOffer') {
          set(createSingleOfferReportedFlagAtom(chat.origin.offerId), true)
        }

        return successMessage
      })
    )
  })
}
